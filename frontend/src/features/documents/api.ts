import { apiClient } from "../../lib/api-client";
import type { DocumentListResponse, DocumentRecord } from "../../types/document";

export async function listDocuments() {
  const { data } = await apiClient.get<DocumentListResponse | DocumentRecord[]>("/documents");
  return Array.isArray(data) ? { items: data, total: data.length } : data;
}

export async function uploadDocument(file: File, knowledgeBaseId?: string) {
  const form = new FormData();
  form.append("file", file);
  if (knowledgeBaseId) form.append("knowledge_base_id", knowledgeBaseId);
  if (knowledgeBaseId) form.append("knowledge_base_id", knowledgeBaseId);
  const { data } = await apiClient.post<DocumentRecord>("/documents", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteDocument(id: string) {
  await apiClient.delete(`/documents/${id}`);
}
