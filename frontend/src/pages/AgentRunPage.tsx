import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, Clock3, FileText, PlayCircle, XCircle } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import LoadingState from "../components/ui/LoadingState";
import { getAgentRun } from "../features/agents/api";
import { formatDate } from "../lib/utils";

function statusTone(status: string) {
  if (status === "completed") return "green" as const;
  if (status === "failed") return "red" as const;
  if (status === "waiting_approval") return "amber" as const;
  return "blue" as const;
}

export default function AgentRunPage() {
  const { runId = "" } = useParams();
  const run = useQuery({ queryKey: ["agent-run", runId], queryFn: () => getAgentRun(runId), enabled: Boolean(runId), refetchInterval: (query) => ["running", "queued"].includes(query.state.data?.status ?? "") ? 3000 : false, retry: false });
  return (
    <>
      <PageHeader title="Agent run details" description={`Execution trace for run ${runId}`} actions={<Link to="/agents"><Button variant="outline"><ArrowLeft size={15} /> Back to agents</Button></Link>} />
      {run.isLoading ? <LoadingState label="Loading execution trace..." /> : run.isError ? <Card className="p-5 text-sm text-red-700">{run.error.message}</Card> : run.data && <>
        <Card className="mb-5 flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="text-xs text-slate-500">Agent</p><h2 className="mt-1 text-lg font-semibold text-slate-900">{run.data.agent_name ?? run.data.agent_id}</h2><p className="mt-1 text-xs text-slate-500">Started {formatDate(run.data.created_at)}</p></div><Badge tone={statusTone(run.data.status)}>{run.data.status.replace("_", " ")}</Badge></Card>
        <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <Card className="p-5"><h2 className="font-semibold text-slate-900">Execution timeline</h2><div className="mt-5 space-y-0">{(run.data.events ?? []).map((event, i) => {
            const Icon = event.status === "completed" ? CheckCircle2 : event.status === "failed" ? XCircle : event.status === "running" ? PlayCircle : Circle;
            const tone = event.status === "failed" ? "text-red-600" : event.status === "completed" ? "text-emerald-600" : "text-indigo-600";
            return <div key={event.id} className="relative flex gap-3 pb-6 last:pb-0"><div className="relative flex w-6 justify-center"><Icon size={19} className={tone} />{i < (run.data.events?.length ?? 0) - 1 && <span className="absolute top-6 h-full w-px bg-slate-200" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-slate-800">{event.name}</p>{event.duration_ms != null && <span className="flex items-center gap-1 text-xs text-slate-400"><Clock3 size={12} />{event.duration_ms} ms</span>}</div>{event.detail && <p className="mt-1 text-xs leading-5 text-slate-500">{event.detail}</p>}</div></div>;
          })}{!run.data.events?.length && <p className="text-sm text-slate-500">No execution events returned by the API.</p>}</div></Card>
          <div className="space-y-5"><Card className="p-5"><h2 className="font-semibold text-slate-900">Input</h2><pre className="mt-3 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{run.data.input ?? "No input returned"}</pre></Card><Card className="p-5"><div className="flex items-center gap-2"><FileText size={17} className="text-indigo-600" /><h2 className="font-semibold text-slate-900">Final output</h2></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{run.data.final_output ?? "The agent has not returned a final output yet."}</p></Card></div>
        </div>
      </>}
    </>
  );
}
