from pathlib import Path
import fitz
from docx import Document as DocxDocument
from fastapi import HTTPException
from app.core.config import settings


def extract_pages(path: Path, content_type: str | None) -> list[tuple[int | None, str]]:
    suffix = path.suffix.lower()
    try:
        if suffix == ".pdf":
            with fitz.open(path) as pdf:
                return [(i + 1, page.get_text("text").strip()) for i, page in enumerate(pdf) if page.get_text("text").strip()]
        if suffix == ".docx":
            doc = DocxDocument(path)
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
            return [(None, text)] if text else []
        if suffix in {".txt", ".md"}:
            text = path.read_text(encoding="utf-8", errors="replace").strip()
            return [(None, text)] if text else []
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not extract document text: {exc}") from exc
    raise HTTPException(status_code=415, detail="Supported file types: PDF, DOCX, TXT, MD.")


def chunk_text(text: str, size: int | None = None, overlap: int | None = None) -> list[str]:
    size = size or settings.chunk_size
    overlap = settings.chunk_overlap if overlap is None else overlap
    if size <= 0 or overlap < 0 or overlap >= size:
        raise ValueError("Chunk overlap must be >= 0 and smaller than chunk size.")
    text = " ".join(text.split())
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        if end < len(text):
            boundary = text.rfind(" ", start, end)
            if boundary > start + size // 2:
                end = boundary
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)
    return chunks
