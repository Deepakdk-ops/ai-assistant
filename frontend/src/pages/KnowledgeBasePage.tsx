import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, Layers3, Search, ShieldCheck } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import LoadingState from "../components/ui/LoadingState";
import { createKnowledgeBase, listKnowledgeBases } from "../features/knowledge-bases/api";

export default function KnowledgeBasePage() {
  const qc = useQueryClient(); const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [showForm, setShowForm] = useState(false);
  const query = useQuery({ queryKey: ["knowledge-bases"], queryFn: listKnowledgeBases, retry: false });
  const create = useMutation({ mutationFn: createKnowledgeBase, onSuccess: () => { qc.invalidateQueries({ queryKey: ["knowledge-bases"] }); setName(""); setDescription(""); setShowForm(false); } });
  return <>
    <PageHeader title="Knowledge bases" description="Create collections and scope retrieval to documents assigned to each collection." actions={<Button onClick={() => setShowForm(v => !v)}><Database size={16} /> New knowledge base</Button>} />
    {showForm && <Card className="mb-5 p-5"><form className="grid gap-3 md:grid-cols-2" onSubmit={e => { e.preventDefault(); create.mutate({ name, description }); }}><label className="text-sm font-medium">Name<input required minLength={1} maxLength={180} value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label><label className="text-sm font-medium">Description<input value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label><div className="md:col-span-2"><Button type="submit" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create collection"}</Button></div></form>{create.isError && <p role="alert" className="mt-3 text-sm text-red-600">{create.error.message}</p>}</Card>}
    <div className="grid gap-4 md:grid-cols-3">{[{ icon: Layers3, title: "Collections", text: "Group related source documents." }, { icon: Search, title: "Scoped retrieval", text: "Chat requests can retrieve only from a selected collection." }, { icon: ShieldCheck, title: "Access control", text: "Collections and documents are isolated per account." }].map(({ icon: Icon, title, text }) => <Card key={title} className="p-5"><div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-700"><Icon size={20} /></div><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{text}</p></Card>)}</div>
    <Card className="mt-6 p-5"><h2 className="mb-4 font-semibold">Your knowledge bases</h2>{query.isLoading ? <LoadingState label="Loading collections…" /> : query.isError ? <p className="text-sm text-red-600">Unable to load collections: {query.error.message}</p> : !query.data?.length ? <EmptyState title="No knowledge bases yet" description="Create a knowledge base, then assign documents to it on the Documents page." /> : <div className="grid gap-3 md:grid-cols-2">{query.data.map(kb => <div key={kb.id} className="rounded-xl border border-slate-200 p-4"><h3 className="font-semibold">{kb.name}</h3><p className="mt-1 text-sm text-slate-500">{kb.description || "No description"}</p><p className="mt-3 text-xs text-slate-400">Created {new Date(kb.created_at).toLocaleString()}</p></div>)}</div>}</Card>
  </>;
}
