export type DocumentStatus = "queued" | "processing" | "processed" | "failed";

export interface DocumentRecord {
  id: string;
  name: string;
  content_type?: string;
  size_bytes?: number;
  status: DocumentStatus;
  chunk_count?: number;
  created_at?: string;
  error_message?: string | null;
}

export interface DocumentListResponse {
  items: DocumentRecord[];
  total: number;
}
