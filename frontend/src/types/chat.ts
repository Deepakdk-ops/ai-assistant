export interface Citation {
  document_id: string;
  chunk_id: string;
  title: string;
  page?: number | null;
  excerpt: string;
}

export interface ChatRequest {
  question: string;
  conversation_id?: string;
  document_ids?: string[];
  knowledge_base_id?: string;
  mode?: "rag" | "general";
}

export interface ChatResponse {
  answer: string;
  conversation_id: string;
  citations: Citation[];
  insufficient_evidence: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  updated_at?: string;
}
