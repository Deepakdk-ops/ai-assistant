import { apiClient } from "../../lib/api-client";

export interface DashboardSummary {
  documents: number;
  knowledge_bases: number;
  conversations: number;
  agent_runs: number;
}

export async function getDashboardSummary() {
  const { data } = await apiClient.get<DashboardSummary>("/dashboard/summary");
  return data;
}

export interface HealthStatus { status: string; database: string; redis: string; background_jobs: string; }
export async function getHealthStatus() { const { data } = await apiClient.get<HealthStatus>("/health"); return data; }
