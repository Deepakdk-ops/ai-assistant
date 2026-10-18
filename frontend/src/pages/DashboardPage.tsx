import { useQuery } from "@tanstack/react-query";
import { Activity, Bot, Database, FileText, MessageSquare, Plus, Upload, Server, CheckCircle2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import MetricCard from "../components/dashboard/MetricCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import { getDashboardSummary, getHealthStatus } from "../features/dashboard/api";

export default function DashboardPage() {
  const summary = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary, retry: false });
  const data = summary.data;
  const health = useQuery({ queryKey: ["health-status"], queryFn: getHealthStatus, retry: false, refetchInterval: 30000 });
  const metrics = [
    { title: "Documents", value: data?.documents ?? "—", note: "Indexed knowledge sources", icon: FileText, tint: "indigo" as const },
    { title: "Knowledge bases", value: data?.knowledge_bases ?? "—", note: "Organized collections", icon: Database, tint: "teal" as const },
    { title: "Conversations", value: data?.conversations ?? "—", note: "Saved chat sessions", icon: MessageSquare, tint: "violet" as const },
    { title: "Agent runs", value: data?.agent_runs ?? "—", note: "Workflow executions", icon: Bot, tint: "amber" as const },
  ];
  return (
    <>
      <PageHeader title="Dashboard" description="Your overview of documents, knowledge, conversations, and agent workflows."
        actions={<><Link to="/documents"><Button variant="outline"><Upload size={16} /> Upload documents</Button></Link><Link to="/chat"><Button><Plus size={16} /> Start a chat</Button></Link></>} />
      {summary.isError && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Could not load live dashboard metrics: {summary.error.message}</div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-5"><div className="flex items-center gap-2"><Server size={19} className="text-indigo-600" /><h2 className="font-semibold text-slate-900">Runtime health</h2></div><p className="mt-1 text-sm text-slate-500">Live API, database and Redis health check; refreshes every 30 seconds.</p>{health.isLoading ? <p className="mt-5 text-sm text-slate-500">Checking services…</p> : health.isError ? <p className="mt-5 text-sm text-red-600">Health endpoint unavailable: {health.error.message}</p> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{[{ label: "API", value: health.data?.status }, { label: "PostgreSQL", value: health.data?.database }, { label: "Redis", value: health.data?.redis }, { label: "Background jobs", value: health.data?.background_jobs }].map(item => <div key={item.label} className="flex items-start gap-2 rounded-xl border border-slate-100 p-3"><span className="mt-0.5">{item.value === "connected" || item.value === "ok" ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-amber-600" />}</span><div><p className="text-sm font-medium text-slate-800">{item.label}</p><p className="mt-1 text-xs text-slate-500">{item.value ?? "unknown"}</p></div></div>)}</div>}</Card>
        <RecentActivity />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[{ title: "Knowledge Assistant", text: "Ask questions with citations.", to: "/chat", icon: MessageSquare }, { title: "Agent workspace", text: "Run controlled tool workflows.", to: "/agents", icon: Bot }, { title: "Evaluation lab", text: "Measure quality and reliability.", to: "/evaluations", icon: Activity }].map(({ title, text, to, icon: Icon }) => (
          <Link key={title} to={to} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-indigo-200">
            <div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-700"><Icon size={20} /></div><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm text-slate-500">{text}</p><p className="mt-4 text-sm font-medium text-indigo-700">Open workspace →</p>
          </Link>
        ))}
      </div>
    </>
  );
}
