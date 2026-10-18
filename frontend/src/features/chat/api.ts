import { apiClient } from "../../lib/api-client";
import type { ChatRequest, ChatResponse, Conversation } from "../../types/chat";

export async function askQuestion(payload: ChatRequest) {
  const { data } = await apiClient.post<ChatResponse>("/chat", payload);
  return data;
}

export async function listConversations() {
  const { data } = await apiClient.get<Conversation[] | { items: Conversation[] }>("/conversations");
  return Array.isArray(data) ? data : data.items;
}

export async function getConversation(id: string) { const { data } = await apiClient.get<Conversation & { messages: Array<{id:string; role:"user"|"assistant"; content:string; citations?: any[]; insufficient_evidence?: boolean}> }>(`/conversations/${id}`); return data; }

export async function getConversation(id: string) { const { data } = await apiClient.get<Conversation & { messages: Array<{id:string; role:"user"|"assistant"; content:string; citations?: any[]; insufficient_evidence?: boolean}> }>(`/conversations/${id}`); return data; }
