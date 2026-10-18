import { useEffect, useState } from "react";
import { apiClient } from "../lib/api-client";
import { Check, Cpu, Database, KeyRound, Save, Server } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

export default function SettingsPage() {
  const [provider, setProvider] = useState("ollama");
  const [model, setModel] = useState("llama3.1:8b");
  const [embedding, setEmbedding] = useState("nomic-embed-text");
  const [saved, setSaved] = useState(false);
  const [topK, setTopK] = useState(5);
  const [temperature, setTemperature] = useState(0.2);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiClient.get("/settings").then(({data}) => { setProvider(data.provider ?? "ollama"); setModel(data.chat_model); setEmbedding(data.embedding_model); setTopK(data.retrieval_top_k ?? 5); setTemperature(data.temperature ?? 0.2); }).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  async function save() { setError(""); try { await apiClient.put("/settings", { chat_model: model, embedding_model: embedding, retrieval_top_k: topK, temperature }); setSaved(true); window.setTimeout(() => setSaved(false), 2500); } catch (e) { setError(e instanceof Error ? e.message : "Unable to save settings"); } }
  return (
    <>
      <PageHeader title="Settings" description="Configure model preferences and the local-first development environment." actions={<Button onClick={save} disabled={loading}><Save size={15} /> Save preferences</Button>} />
      {error && <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {saved && <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"><Check size={16} /> Preferences saved to your account.</div>}
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5"><div className="flex items-center gap-2"><Cpu size={19} className="text-indigo-600" /><h2 className="font-semibold text-slate-900">Model configuration</h2></div><p className="mt-1 text-sm text-slate-500">Choose the model provider configured by your backend.</p>
          <label className="mt-5 block text-sm font-medium text-slate-700">LLM provider</label><div className="mt-2 grid grid-cols-2 gap-3">{[{ id: "ollama", title: "Ollama", detail: "Local models" }, { id: "hosted", title: "Hosted API", detail: "Not configured" }].map((item) => <button key={item.id} onClick={() => setProvider(item.id)} disabled={item.id === "hosted"} className={`rounded-xl border p-4 text-left ${provider === item.id ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"}`}><p className="text-sm font-semibold text-slate-800">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.detail}</p></button>)}</div>
          <label className="mt-5 block text-sm font-medium text-slate-700">Chat model</label><input value={model} onChange={(e) => setModel(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" />
          <label className="mt-4 block text-sm font-medium text-slate-700">Embedding model</label><input value={embedding} onChange={(e) => setEmbedding(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" />
          <label className="mt-4 block text-sm font-medium text-slate-700">Retrieval top-k: {topK}</label><input type="range" min={1} max={20} value={topK} onChange={e=>setTopK(Number(e.target.value))} className="mt-2 w-full" />
          <label className="mt-4 block text-sm font-medium text-slate-700">Generation temperature: {temperature.toFixed(1)}</label><input type="range" min={0} max={1} step={0.1} value={temperature} onChange={e=>setTemperature(Number(e.target.value))} className="mt-2 w-full" />
          <p className="mt-3 text-xs leading-5 text-slate-400">Preferences are saved per account. Changing embedding model requires re-indexing documents and matching vector dimensions; the runtime currently uses server environment model configuration.</p>
        </Card>
        <div className="space-y-5">
          <Card className="p-5"><div className="flex items-center gap-2"><Database size={19} className="text-teal-700" /><h2 className="font-semibold text-slate-900">Database</h2></div><div className="mt-4 flex items-center justify-between"><span className="text-sm text-slate-600">PostgreSQL + pgvector</span><Badge tone="blue">Backend managed</Badge></div><p className="mt-2 text-xs leading-5 text-slate-500">Keep credentials on the server. The frontend must never connect directly to PostgreSQL.</p></Card>
          <Card className="p-5"><div className="flex items-center gap-2"><KeyRound size={19} className="text-amber-600" /><h2 className="font-semibold text-slate-900">Secrets and API keys</h2></div><div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800"><Server size={16} className="shrink-0" /> Store API keys in backend environment variables or a secret manager. Do not place secrets in VITE_* variables.</div></Card>
          <Card className="p-5"><h2 className="font-semibold text-slate-900">Current preferences</h2><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Provider</dt><dd className="font-medium text-slate-800">{provider}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Chat model</dt><dd className="font-medium text-slate-800">{model || "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Embedding model</dt><dd className="font-medium text-slate-800">{embedding || "—"}</dd></div></dl></Card>
        </div>
      </div>
    </>
  );
}
