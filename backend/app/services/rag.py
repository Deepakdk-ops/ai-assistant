from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.core.config import settings
from app.models.entities import Document, DocumentChunk
from app.services.ollama import ollama_service


async def ingest_document(db: Session, document: Document, page_texts: list[tuple[int | None, str]]) -> int:
    chunks_to_store: list[tuple[int | None, str]] = []
    from app.services.ingestion import chunk_text
    for page_number, text in page_texts:
        for chunk in chunk_text(text):
            chunks_to_store.append((page_number, chunk))
    if not chunks_to_store:
        raise HTTPException(status_code=422, detail="No extractable text was found in this document.")

    vectors = await ollama_service.embed([text for _, text in chunks_to_store])
    db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete()
    for index, ((page, text), vector) in enumerate(zip(chunks_to_store, vectors, strict=True)):
        db.add(DocumentChunk(document_id=document.id, chunk_index=index, text=text, page_number=page, embedding=vector))
    document.chunk_count = len(chunks_to_store)
    document.status = "processed"
    document.error_message = None
    db.commit()
    db.refresh(document)
    return len(chunks_to_store)


async def retrieve_chunks(
    db: Session,
    question: str,
    document_ids: list[str] | None = None,
    top_k: int | None = None,
    user_id: str | None = None,
    embedding_model: str | None = None,
    top_k_override: int | None = None,
    knowledge_base_id: str | None = None,
) -> list[tuple[DocumentChunk, Document, float]]:
    query_vector = (await ollama_service.embed([question], model=embedding_model))[0]
    stmt = (
        select(DocumentChunk, Document, DocumentChunk.embedding.cosine_distance(query_vector).label("distance"))
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(Document.status == "processed")
    )
    if document_ids is not None:
        if not document_ids:
            return []
        stmt = stmt.where(Document.id.in_(document_ids))
    if user_id is not None:
        stmt = stmt.where(Document.user_id == user_id)
    if knowledge_base_id is not None:
        stmt = stmt.where(Document.knowledge_base_id == knowledge_base_id)
    stmt = stmt.order_by("distance").limit(top_k_override or top_k or settings.retrieval_top_k)
    rows = db.execute(stmt).all()
    return [(chunk, doc, float(distance)) for chunk, doc, distance in rows]
