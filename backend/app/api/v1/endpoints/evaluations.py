from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import EvaluationRun, EvaluationCase, Document, User
from app.schemas.api import EvaluationRunIn, EvaluationRunOut, EvaluationCaseIn, EvaluationCaseOut
from app.api.dependencies import get_current_user
from app.tasks import run_evaluation

router = APIRouter()

@router.get("/runs", response_model=list[EvaluationRunOut])
def list_runs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(select(EvaluationRun).where(EvaluationRun.user_id == user.id).order_by(EvaluationRun.created_at.desc())).all()

@router.post("/runs", response_model=EvaluationRunOut, status_code=202)
def create_run(payload: EvaluationRunIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    run = EvaluationRun(user_id=user.id, name=f"RAG evaluation: {payload.dataset_id}", dataset_id=payload.dataset_id, status="queued")
    db.add(run); db.commit(); db.refresh(run)
    try: run_evaluation.delay(run.id, user.id)
    except Exception as exc:
        run.status="failed"; run.error_message=f"Could not enqueue evaluation. Check Redis/Celery worker: {str(exc)[:500]}"; db.commit()
        raise HTTPException(status_code=503, detail=run.error_message)
    return run

@router.get("/runs/{run_id}", response_model=EvaluationRunOut)
def get_run(run_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    run = db.scalar(select(EvaluationRun).where(EvaluationRun.id == run_id, EvaluationRun.user_id == user.id))
    if not run: raise HTTPException(status_code=404, detail="Evaluation run not found.")
    return run


@router.get("/datasets/{dataset_id}/cases", response_model=list[EvaluationCaseOut])
def list_cases(dataset_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(select(EvaluationCase).where(EvaluationCase.user_id == user.id, EvaluationCase.dataset_id == dataset_id).order_by(EvaluationCase.created_at)).all()

@router.post("/datasets/{dataset_id}/cases", response_model=EvaluationCaseOut, status_code=201)
def create_case(dataset_id: str, payload: EvaluationCaseIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.dataset_id != dataset_id:
        raise HTTPException(status_code=422, detail="Dataset ID in path and payload must match.")
    if payload.expected_document_ids:
        owned = set(db.scalars(select(Document.id).where(Document.user_id == user.id, Document.id.in_(payload.expected_document_ids))).all())
        if owned != set(payload.expected_document_ids):
            raise HTTPException(status_code=404, detail="One or more expected documents were not found.")
    case = EvaluationCase(user_id=user.id, dataset_id=dataset_id, question=payload.question, expected_answer=payload.expected_answer, expected_document_ids=payload.expected_document_ids)
    db.add(case); db.commit(); db.refresh(case)
    return case

@router.delete("/datasets/{dataset_id}/cases/{case_id}", status_code=204)
def delete_case(dataset_id: str, case_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    case = db.scalar(select(EvaluationCase).where(EvaluationCase.id == case_id, EvaluationCase.dataset_id == dataset_id, EvaluationCase.user_id == user.id))
    if not case:
        raise HTTPException(status_code=404, detail="Evaluation case not found.")
    db.delete(case); db.commit()
