import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, BrainCircuit, FileSearch, Play, Plus, Wrench } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import { listAgents, startAgentRun, createAgent } from "../features/agents/api";

export default function AgentsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false); const [agentName, setAgentName] = useState(""); const [agentDescription, setAgentDescription] = useState("");
  const create = useMutation({ mutationFn: createAgent, onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents"] }); setShowCreate(false); setAgentName(""); setAgentDescription(""); } });
  const agents = useQuery({ queryKey: ["agents"], queryFn: listAgents, retry: false });
  const run = useMutation({ mutationFn: ({ id, input }: { id: string; input: string }) => startAgentRun(id, input), onSuccess: (data) => navigate(`/agents/runs/${data.id}`) });
  return (
    <>
      <PageHeader title="AI Agents" description="Configure and run controlled workflows backed by LangGraph and explicit tools." actions={<Button onClick={() => setShowCreate(v => !v)}><Plus size={16} /> Create agent</Button>} />
      {showCreate && <Card className="mb-5 p-5"><form className="grid gap-3 md:grid-cols-2" onSubmit={e => { e.preventDefault(); create.mutate({ name: agentName, description: agentDescription, tools: ["knowledge_search"] }); }}><label className="text-sm font-medium">Agent name<input required minLength={2} maxLength={180} value={agentName} onChange={e => setAgentName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label><label className="text-sm font-medium">Description<input value={agentDescription} onChange={e => setAgentDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label><p className="text-xs text-slate-500 md:col-span-2">Available tool: knowledge_search. Arbitrary code and external write tools are intentionally not enabled.</p><div><Button type="submit" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create agent"}</Button></div></form>{create.isError && <p role="alert" className="mt-3 text-sm text-red-600">{create.error.message}</p>}</Card>}
      <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-900"><div className="flex items-center gap-2 font-semibold"><BrainCircuit size={17} /> Safe-by-design agent execution</div><p className="mt-1 text-xs leading-5 text-indigo-800">Keep tools allowlisted. Validate tool arguments and authorization on the server. Require approval for sensitive write operations.</p></div>
      {agents.isLoading ? <LoadingState label="Loading agents..." /> : agents.isError ? <Card className="p-5 text-sm text-amber-700">Unable to load agents: {agents.error.message}. Implement GET /agents in FastAPI.</Card> : (agents.data?.length ?? 0) === 0 ? <Card className="p-5"><EmptyState title="No agents configured" description="Create agent definitions in the backend, then they will appear here." /></Card> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{agents.data?.map((agent, index) => {
          const Icon = index % 2 === 0 ? FileSearch : Bot;
          return <Card key={agent.id} className="p-5"><div className="flex items-start justify-between"><div className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><Icon size={21} /></div><Badge tone="green">{agent.status ?? "Available"}</Badge></div><h2 className="mt-4 font-semibold text-slate-900">{agent.name}</h2><p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">{agent.description}</p><div className="mt-4 flex flex-wrap gap-2">{agent.tools.map((tool) => <Badge key={tool} tone="blue"><Wrench size={11} className="mr-1 inline" />{tool}</Badge>)}</div><Button className="mt-5 w-full" disabled={run.isPending} onClick={() => { const input = window.prompt(`What should ${agent.name} do?`, "Summarize relevant information and cite sources."); if (input?.trim()) run.mutate({ id: agent.id, input: input.trim() }); }}><Play size={15} /> Run agent</Button></Card>;
        })}</div>
      )}
      {run.isError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{run.error.message}</p>}
    </>
  );
}
