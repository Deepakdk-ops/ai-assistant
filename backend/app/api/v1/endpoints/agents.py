import asyncio
import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from app.db.session import get_db, SessionLocal
from app.models.entities import AgentDefinition, AgentRun, AgentRunEvent, ApprovalRequest
from app.schemas.api import AgentRunIn, ApprovalDecisionIn, AgentDefinitionIn
from app.services.agent_workflow import build_agent_graph
from app.tasks import run_agent
from app.models.entities import User
from app.api.dependencies import get_current_user

router = APIRouter()


def ensure_seed_agents(db: Session):
    if db.scalar(select(AgentDefinition.id).where(AgentDefinition.user_id.is_(None)).limit(1)):
        return
    db.add_all([
        AgentDefinition(name="Research Agent", description="Search indexed documents and produce a cited research summary.", tools=["knowledge_search"]),
        AgentDefinition(name="Support Agent", description="Answer support questions using approved knowledge sources.", tools=["knowledge_search"]),
    ])
    db.commit()


@router.get("/agents")
def list_agents(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ensure_seed_agents(db)
    agents = db.scalars(select(AgentDefinition).where(or_(AgentDefinition.user_id.is_(None), AgentDefinition.user_id == user.id)).order_by(AgentDefinition.created_at)).all()
    return [{"id": a.id, "name": a.name, "description": a.description, "tools": a.tools or [], "status": a.status, "last_run_at": None} for a in agents]


async def execute_run(run_id: str):
    db = SessionLocal()
    try:
        run = db.get(AgentRun, run_id)
        if not run:
            return
        agent = db.get(AgentDefinition, run.agent_id)
        run.status = "running"
        db.commit()
        started = time.perf_counter()
        event = AgentRunEvent(run_id=run.id, name="LangGraph workflow", status="running", detail="Starting retrieval and response nodes.")
        db.add(event)
        db.commit()
        try:
            graph = await build_agent_graph(db, agent, user_id=run.user_id)
            result = await graph.ainvoke({"user_input": run.input, "tool_events": []})
            events = result.get("tool_events", [])
            for item in events:
                db.add(AgentRunEvent(
                    run_id=run.id,
                    name=item.get("name", "workflow_step"),
                    status=item.get("status", "completed"),
                    detail=item.get("detail"),
                    output_data=item.get("output"),
                ))
            run.final_output = result.get("output", "")
            run.status = "completed"
            event.status = "completed"
            event.duration_ms = int((time.perf_counter() - started) * 1000)
            event.detail = "LangGraph workflow completed."
            db.commit()
        except Exception as exc:
            db.rollback()
            run = db.get(AgentRun, run_id)
            if run:
                run.status = "failed"
                db.add(AgentRunEvent(run_id=run.id, name="workflow_error", status="failed", detail=str(exc)[:1500]))
                db.commit()
    finally:
        db.close()


@router.post("/agents", status_code=201)
def create_agent(payload: AgentDefinitionIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    allowed_tools = {"knowledge_search"}
    if any(tool not in allowed_tools for tool in payload.tools):
        raise HTTPException(status_code=422, detail="Only the server-implemented knowledge_search tool is currently available.")
    agent = AgentDefinition(user_id=user.id, name=payload.name.strip(), description=payload.description.strip(), tools=payload.tools, status="available")
    db.add(agent); db.commit(); db.refresh(agent)
    return {"id": agent.id, "name": agent.name, "description": agent.description, "tools": agent.tools or [], "status": agent.status, "last_run_at": None}


@router.post("/agents/{agent_id}/runs", status_code=202)
def start_run(agent_id: str, payload: AgentRunIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ensure_seed_agents(db)
    agent = db.scalar(select(AgentDefinition).where(AgentDefinition.id == agent_id, or_(AgentDefinition.user_id.is_(None), AgentDefinition.user_id == user.id)))
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")
    run = AgentRun(user_id=user.id, agent_id=agent.id, agent_name=agent.name, status="queued", input=payload.input)
    db.add(run)
    db.commit()
    db.refresh(run)
    try:
        run_agent.delay(run.id, user.id)
    except Exception as exc:
        run.status = "failed"; run.final_output = f"Could not enqueue agent run. Check Redis/Celery worker: {str(exc)[:500]}"; db.commit()
    return {"id": run.id, "agent_id": run.agent_id, "agent_name": run.agent_name, "status": run.status, "input": run.input, "final_output": None, "created_at": run.created_at}


@router.get("/agent-runs/{run_id}")
def get_run(run_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    run = db.scalar(select(AgentRun).where(AgentRun.id == run_id, AgentRun.user_id == user.id))
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found.")
    events = db.scalars(select(AgentRunEvent).where(AgentRunEvent.run_id == run.id).order_by(AgentRunEvent.created_at)).all()
    return {
        "id": run.id, "agent_id": run.agent_id, "agent_name": run.agent_name,
        "status": run.status, "input": run.input, "final_output": run.final_output,
        "created_at": run.created_at,
        "events": [{"id": e.id, "name": e.name, "status": e.status, "detail": e.detail, "duration_ms": e.duration_ms, "input": e.input_data, "output": e.output_data, "created_at": e.created_at} for e in events],
    }


@router.get("/agent-runs/{run_id}/events")
def get_run_events(run_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    run = db.scalar(select(AgentRun).where(AgentRun.id == run_id, AgentRun.user_id == user.id))
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found.")
    events = db.scalars(select(AgentRunEvent).where(AgentRunEvent.run_id == run_id).order_by(AgentRunEvent.created_at)).all()
    return [{"id": e.id, "name": e.name, "status": e.status, "detail": e.detail, "duration_ms": e.duration_ms, "created_at": e.created_at} for e in events]


@router.post("/approvals/{approval_id}/decision")
def decide_approval(approval_id: str, payload: ApprovalDecisionIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    approval = db.scalar(select(ApprovalRequest).join(AgentRun, AgentRun.id == ApprovalRequest.run_id).where(ApprovalRequest.id == approval_id, AgentRun.user_id == user.id))
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found.")
    if approval.status != "pending":
        raise HTTPException(status_code=409, detail=f"Approval already {approval.status}.")
    if payload.decision not in {"approved", "rejected"}:
        raise HTTPException(status_code=422, detail="decision must be 'approved' or 'rejected'.")
    approval.status = payload.decision
    approval.comment = payload.comment
    db.commit()
    return {"id": approval.id, "status": approval.status}
