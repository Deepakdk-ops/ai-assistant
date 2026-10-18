import { apiClient } from "../../lib/api-client";
import type { AgentDefinition, AgentRun, ApprovalDecision } from "../../types/agent";

export async function listAgents() {
  const { data } = await apiClient.get<AgentDefinition[] | { items: AgentDefinition[] }>("/agents");
  return Array.isArray(data) ? data : data.items;
}

export async function startAgentRun(agentId: string, input: string) {
  const { data } = await apiClient.post<AgentRun>(`/agents/${agentId}/runs`, { input });
  return data;
}

export async function getAgentRun(runId: string) {
  const { data } = await apiClient.get<AgentRun>(`/agent-runs/${runId}`);
  return data;
}

export async function submitApproval(approvalId: string, payload: ApprovalDecision) {
  const { data } = await apiClient.post(`/approvals/${approvalId}/decision`, payload);
  return data;
}

export async function createAgent(payload: { name: string; description: string; tools: string[] }) {
  const { data } = await apiClient.post<AgentDefinition>("/agents", payload);
  return data;
}
