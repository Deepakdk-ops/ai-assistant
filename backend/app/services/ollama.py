import httpx
from fastapi import HTTPException
from app.core.config import settings


class OllamaService:
    def __init__(self):
        self.base_url = settings.ollama_base_url.rstrip("/")

    async def embed(self, texts: list[str], model: str | None = None) -> list[list[float]]:
        if not texts:
            return []
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(
                    f"{self.base_url}/api/embed",
                    json={"model": model or settings.ollama_embed_model, "input": texts},
                )
                response.raise_for_status()
                data = response.json()
            embeddings = data.get("embeddings")
            if not embeddings or len(embeddings) != len(texts):
                raise ValueError("Ollama returned an unexpected embedding response.")
            for vector in embeddings:
                if len(vector) != settings.embedding_dimensions:
                    raise ValueError(
                        f"Embedding dimension mismatch: expected {settings.embedding_dimensions}, got {len(vector)}. "
                        "Set EMBEDDING_DIMENSIONS to match your embedding model and recreate the database."
                    )
            return embeddings
        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(
                status_code=503,
                detail=f"Embedding service unavailable or misconfigured. Check Ollama and model "
                       f"'{model or settings.ollama_embed_model}': {exc}",
            ) from exc

    async def generate(self, prompt: str, system: str | None = None, model: str | None = None, temperature: float | None = None) -> str:
        payload = {
            "model": model or settings.ollama_chat_model,
            "prompt": prompt,
            "options": {"temperature": temperature if temperature is not None else 0.2},
            "stream": False,
        }
        if system:
            payload["system"] = system
        try:
            async with httpx.AsyncClient(timeout=180) as client:
                response = await client.post(f"{self.base_url}/api/generate", json=payload)
                response.raise_for_status()
                data = response.json()
            answer = data.get("response", "").strip()
            if not answer:
                raise ValueError("Ollama returned an empty response.")
            return answer
        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(
                status_code=503,
                detail=f"LLM service unavailable. Check Ollama and model '{model or settings.ollama_chat_model}': {exc}",
            ) from exc


ollama_service = OllamaService()
