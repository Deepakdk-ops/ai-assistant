import { apiClient } from "../../lib/api-client";

export interface EvaluationRun {
  id: string;
  name: string;
  status: "queued" | "running" | "completed" | "failed";
  recall_at_k?: number;
  groundedness?: number;
  correctness?: number;
  latency_ms?: number;
  cost_usd?: number;
  error_message?: string | null;
  created_at?: string;
}

export async function listEvaluationRuns() {
  const { data } = await apiClient.get<EvaluationRun[] | { items: EvaluationRun[] }>("/evaluations/runs");
  return Array.isArray(data) ? data : data.items;
}

export async function startEvaluation(datasetId: string) {
  const { data } = await apiClient.post<EvaluationRun>("/evaluations/runs", { dataset_id: datasetId });
  return data;
}

export interface EvaluationCase { id: string; dataset_id: string; question: string; expected_answer?: string | null; expected_document_ids?: string[] | null; created_at: string; }
export async function listEvaluationCases(datasetId: string) { const { data } = await apiClient.get<EvaluationCase[]>(`/evaluations/datasets/${encodeURIComponent(datasetId)}/cases`); return data; }
export async function createEvaluationCase(datasetId: string, payload: { question: string; expected_answer?: string; expected_document_ids?: string[] }) { const { data } = await apiClient.post<EvaluationCase>(`/evaluations/datasets/${encodeURIComponent(datasetId)}/cases`, { dataset_id: datasetId, ...payload }); return data; }
export async function deleteEvaluationCase(datasetId: string, caseId: string) { await apiClient.delete(`/evaluations/datasets/${encodeURIComponent(datasetId)}/cases/${caseId}`); }
