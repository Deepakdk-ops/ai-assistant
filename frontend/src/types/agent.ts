export type RunStatus = "queued" | "running" | "completed" | "failed" | "waiting_approval";

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  tools: string[];
  status?: string;
  last_run_at?: string | null;
}

export interface AgentRun {
  id: string;
  agent_id: string;
  agent_name?: string;
  status: RunStatus;
  input?: string;
  final_output?: string | null;
  created_at?: string;
  events?: AgentRunEvent[];
}

export interface AgentRunEvent {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "waiting_approval";
  detail?: string;
  duration_ms?: number;
  input?: unknown;
  output?: unknown;
  created_at?: string;
}

export interface ApprovalDecision {
  decision: "approved" | "rejected";
  comment?: string;
}
