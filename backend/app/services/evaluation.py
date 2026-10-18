"""User-scoped RAG evaluation using labelled cases when available, with an explicit proxy fallback."""
import re
import time
from sqlalchemy import select
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.entities import EvaluationRun, EvaluationCase, DocumentChunk, Document
from app.services.rag import retrieve_chunks
from app.services.ollama import ollama_service


def token_f1(prediction: str, reference: str) -> float:
    pred = re.findall(r"[a-z0-9]+", prediction.lower())
    ref = re.findall(r"[a-z0-9]+", reference.lower())
    if not pred or not ref:
        return 0.0
    from collections import Counter
    overlap = sum((Counter(pred) & Counter(ref)).values())
    if overlap == 0:
        return 0.0
    precision = overlap / len(pred)
    recall = overlap / len(ref)
    return 2 * precision * recall / (precision + recall)


async def execute_evaluation(run_id: str, user_id: str | None = None):
    db = SessionLocal()
    started = time.perf_counter()
    try:
        run = db.get(EvaluationRun, run_id)
        if not run or (user_id is not None and run.user_id != user_id):
            return
        run.status = "running"
        run.error_message = None
        db.commit()
        cases = db.scalars(select(EvaluationCase).where(
            EvaluationCase.user_id == run.user_id,
            EvaluationCase.dataset_id == run.dataset_id,
        ).order_by(EvaluationCase.created_at)).all()
        if cases:
            recall_values: list[float] = []
            grounded_values: list[float] = []
            correctness_values: list[float] = []
            for case in cases:
                rows = await retrieve_chunks(db, case.question, top_k=settings.retrieval_top_k, user_id=run.user_id)
                found_document_ids = {doc.id for _, doc, _ in rows}
                if case.expected_document_ids:
                    recall_values.append(1.0 if found_document_ids.intersection(set(case.expected_document_ids)) else 0.0)
                    grounded_values.append(len(found_document_ids.intersection(set(case.expected_document_ids))) / max(1, len(found_document_ids)))
                elif rows:
                    grounded_values.append(1.0)
                context = "\n\n".join(f"[{doc.name}, page {chunk.page_number or 'N/A'}] {chunk.text}" for chunk, doc, _ in rows)
                if case.expected_answer:
                    generated = await ollama_service.generate(
                        f"Answer using only this context. If it is insufficient, say so.\n\nContext:\n{context}\n\nQuestion: {case.question}\nAnswer:",
                        system="You are an evidence-grounded evaluation assistant.",
                    )
                    correctness_values.append(token_f1(generated, case.expected_answer))
            run.recall_at_k = sum(recall_values) / len(recall_values) if recall_values else None
            run.groundedness = sum(grounded_values) / len(grounded_values) if grounded_values else None
            run.correctness = sum(correctness_values) / len(correctness_values) if correctness_values else None
            run.error_message = f"Evaluated {len(cases)} labelled test cases. Correctness uses token-level F1 against expected answers; it is a lexical metric, not an LLM-as-judge score."
        else:
            # Honest baseline fallback for a new install: self-retrieval proxy, not labelled benchmark recall.
            chunks = db.execute(select(DocumentChunk, Document).join(Document, Document.id == DocumentChunk.document_id).where(
                Document.status == "processed", Document.user_id == run.user_id
            ).order_by(DocumentChunk.created_at).limit(30)).all()
            if not chunks:
                run.status = "failed"
                run.error_message = "No processed documents or labelled evaluation cases are available. Index documents or add cases first."
                db.commit()
                return
            hits = 0
            for chunk, _doc in chunks:
                retrieved = await retrieve_chunks(db, chunk.text[:500], top_k=settings.retrieval_top_k, user_id=run.user_id)
                if any(found.id == chunk.id for found, _, _ in retrieved):
                    hits += 1
            run.recall_at_k = hits / len(chunks)
            run.groundedness = None
            run.correctness = None
            run.error_message = f"Evaluated {len(chunks)} sampled chunks using a self-retrieval proxy. Add labelled cases for meaningful benchmark metrics."
        run.latency_ms = int((time.perf_counter() - started) * 1000)
        run.status = "completed"
        db.commit()
    except Exception as exc:
        db.rollback()
        run = db.get(EvaluationRun, run_id)
        if run and (user_id is None or run.user_id == user_id):
            run.status = "failed"
            run.error_message = str(exc)[:1500]
            db.commit()
        raise
    finally:
        db.close()
