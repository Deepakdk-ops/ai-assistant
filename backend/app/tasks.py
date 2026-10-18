import asyncio
from pathlib import Path
from celery import shared_task
from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.entities import Document, EvaluationRun, AgentRun, AgentDefinition, AgentRunEvent
from app.services.events import publish_event
from app.services.ingestion import extract_pages
from app.services.rag import ingest_document
from app.services.evaluation import execute_evaluation
from app.services.agent_workflow import build_agent_graph
import time

@shared_task(bind=True, autoretry_for=(ConnectionError,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def process_document(self, document_id: str, user_id: str | None = None):
    db = SessionLocal()
    try:
        doc = db.get(Document, document_id)
        if not doc: return {"status": "missing"}
        doc.status = "processing"; db.commit()
        publish_event(user_id, "document", document_id, "processing", "Extracting and indexing document", 10)
        path = Path(doc.storage_path or "")
        pages = extract_pages(path, doc.content_type)
        asyncio.run(ingest_document(db, doc, pages))
        db.refresh(doc)
        publish_event(user_id, "document", document_id, doc.status, "Document indexing finished", 100)
        return {"status": doc.status, "chunks": doc.chunk_count}
    except Exception as exc:
        db.rollback(); doc = db.get(Document, document_id)
        if doc: doc.status = "failed"; doc.error_message = str(exc)[:1500]; db.commit()
        publish_event(user_id, "document", document_id, "failed", str(exc)[:500], 100)
        raise
    finally: db.close()

@shared_task(bind=True, autoretry_for=(ConnectionError,), retry_backoff=True, retry_kwargs={"max_retries": 2})
def run_evaluation(self, run_id: str, user_id: str | None = None):
    publish_event(user_id, "evaluation", run_id, "running", "Evaluation started", 5)
    try:
        asyncio.run(execute_evaluation(run_id, user_id=user_id))
        db=SessionLocal()
        try:
            run=db.get(EvaluationRun, run_id); status=run.status if run else "missing"; detail=run.error_message if run else "Run not found"
        finally: db.close()
        publish_event(user_id, "evaluation", run_id, status, detail or "Evaluation finished", 100)
        return {"status": status}
    except Exception as exc:
        publish_event(user_id, "evaluation", run_id, "failed", str(exc)[:500], 100); raise

@shared_task(bind=True, autoretry_for=(ConnectionError,), retry_backoff=True, retry_kwargs={"max_retries": 2})
def run_agent(self, run_id: str, user_id: str | None = None):
    db=SessionLocal(); started=time.perf_counter()
    try:
        run=db.get(AgentRun, run_id)
        if not run: return {"status":"missing"}
        agent=db.get(AgentDefinition, run.agent_id)
        if not agent: run.status="failed"; run.final_output="Agent definition not found"; db.commit(); return {"status":"failed"}
        run.status="running"; db.commit(); publish_event(user_id,"agent",run_id,"running","LangGraph agent started",10)
        graph=asyncio.run(_build_graph(db, agent, user_id))
        result=asyncio.run(graph.ainvoke({"user_input":run.input,"tool_events":[]}))
        for item in result.get("tool_events",[]):
            db.add(AgentRunEvent(run_id=run.id,name=item.get("name","workflow_step"),status=item.get("status","completed"),detail=item.get("detail"),output_data=item.get("output")))
        run.final_output=result.get("output",""); run.status="completed"; db.commit()
        publish_event(user_id,"agent",run_id,"completed","Agent run completed",100)
        return {"status":"completed","duration_ms":int((time.perf_counter()-started)*1000)}
    except Exception as exc:
        db.rollback(); run=db.get(AgentRun,run_id)
        if run: run.status="failed"; run.final_output=f"Agent failed: {str(exc)[:800]}"; db.commit()
        publish_event(user_id,"agent",run_id,"failed",str(exc)[:500],100); raise
    finally: db.close()

async def _build_graph(db, agent, user_id=None):
    return await build_agent_graph(db, agent, user_id=user_id)
