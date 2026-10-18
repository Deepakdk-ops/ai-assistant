import { apiClient } from "../../lib/api-client";
export type KnowledgeBase = { id: string; name: string; description: string; created_at: string };
export async function listKnowledgeBases() { const { data } = await apiClient.get<KnowledgeBase[]>("/knowledge-bases"); return data; }
export async function createKnowledgeBase(payload: { name: string; description: string }) { const { data } = await apiClient.post<KnowledgeBase>("/knowledge-bases", payload); return data; }
