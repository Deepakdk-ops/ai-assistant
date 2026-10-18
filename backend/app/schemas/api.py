from datetime import datetime
from pydantic import BaseModel, Field


class DocumentOut(BaseModel):
    id: str
    name: str
    content_type: str | None = None
    size_bytes: int = 0
    status: str
    chunk_count: int = 0
    created_at: datetime | None = None
    error_message: str | None = None

    model_config = {"from_attributes": True}


class DocumentListOut(BaseModel):
    items: list[DocumentOut]
    total: int


class CitationOut(BaseModel):
    document_id: str
    chunk_id: str
    title: str
    page: int | None = None
    excerpt: str


class ChatIn(BaseModel):
    question: str = Field(min_length=1, max_length=8000)
    conversation_id: str | None = None
    document_ids: list[str] | None = None
    knowledge_base_id: str | None = None
    mode: str = Field(default="rag", pattern="^(rag|general)$")


class ChatOut(BaseModel):
    answer: str
    conversation_id: str
    citations: list[CitationOut]
    insufficient_evidence: bool


class ConversationOut(BaseModel):
    id: str
    title: str
    updated_at: datetime | None = None


class KnowledgeBaseIn(BaseModel):
    name: str = Field(min_length=1, max_length=180)
    description: str = ""


class KnowledgeBaseOut(BaseModel):
    id: str
    name: str
    description: str
    created_at: datetime


class AgentRunIn(BaseModel):
    input: str = Field(min_length=1, max_length=8000)


class ApprovalDecisionIn(BaseModel):
    decision: str
    comment: str | None = None


class EvaluationRunIn(BaseModel):
    dataset_id: str = "default-rag-dataset"


class EvaluationRunOut(BaseModel):
    id: str
    name: str
    status: str
    recall_at_k: float | None = None
    groundedness: float | None = None
    correctness: float | None = None
    latency_ms: int | None = None
    cost_usd: float | None = None
    error_message: str | None = None
    created_at: datetime


class EvaluationCaseIn(BaseModel):
    dataset_id: str = Field(min_length=1, max_length=180)
    question: str = Field(min_length=1, max_length=8000)
    expected_answer: str | None = Field(default=None, max_length=8000)
    expected_document_ids: list[str] = Field(default_factory=list, max_length=50)

class EvaluationCaseOut(BaseModel):
    id: str
    dataset_id: str
    question: str
    expected_answer: str | None = None
    expected_document_ids: list[str] | None = None
    created_at: datetime
    model_config = {"from_attributes": True}


class AgentDefinitionIn(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    description: str = Field(default="", max_length=4000)
    tools: list[str] = Field(default_factory=lambda: ["knowledge_search"], max_length=10)
