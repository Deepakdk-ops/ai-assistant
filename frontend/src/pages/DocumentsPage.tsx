import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileText, Search, Trash2, Upload } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
// import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import UploadDropzone from "../components/documents/UploadDropzone";
import DocumentStatus from "../components/documents/DocumentStatus";
import { deleteDocument, listDocuments, uploadDocument } from "../features/documents/api";
import { formatDate } from "../lib/utils";
import { listKnowledgeBases } from "../features/knowledge-bases/api";

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [knowledgeBaseId, setKnowledgeBaseId] = useState("");
  const knowledgeBases = useQuery({ queryKey: ["knowledge-bases"], queryFn: listKnowledgeBases, retry: false });
  const docs = useQuery({ queryKey: ["documents"], queryFn: listDocuments, retry: false });
  const upload = useMutation({ mutationFn: (file: File) => uploadDocument(file, knowledgeBaseId || undefined), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }) });
  const remove = useMutation({ mutationFn: deleteDocument, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }) });
  const filtered = useMemo(() => (docs.data?.items ?? []).filter((doc) => doc.name.toLowerCase().includes(search.toLowerCase())), [docs.data, search]);
  return (
    <>
      <PageHeader title="Documents" description="Upload, index, and manage the source material used by your RAG assistant." />
      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4"><Card className="p-4"><label className="block text-sm font-medium text-slate-700">Knowledge base (optional)<select value={knowledgeBaseId} onChange={e => setKnowledgeBaseId(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">All my documents</option>{(knowledgeBases.data ?? []).map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}</select><p className="mt-1 text-xs text-slate-500">Assign the uploaded file to a collection for scoped retrieval.</p></label></Card><UploadDropzone busy={upload.isPending} onUpload={(file) => upload.mutate(file)} />
          {upload.isError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{upload.error.message}</p>}
          {upload.isSuccess && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Upload request completed.</p>}
          <Card className="p-4"><h3 className="text-sm font-semibold text-slate-800">Supported workflow</h3><ul className="mt-3 space-y-2 text-xs leading-5 text-slate-500"><li>1. Validate and extract text.</li><li>2. Split content into chunks.</li><li>3. Generate embeddings.</li><li>4. Store chunks and vectors.</li><li>5. Query only accessible sources.</li></ul></Card>
        </div>
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-slate-900">Your files</h2><p className="mt-1 text-xs text-slate-500">{docs.data?.total ?? 0} documents</p></div><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 sm:w-64" /></div></div>
          {docs.isLoading ? <div className="px-5"><LoadingState label="Loading documents..." /></div> : docs.isError ? <div className="p-5 text-sm text-amber-700">Unable to load documents: {docs.error.message}. Check that GET /documents returns the documented schema.</div> : filtered.length === 0 ? <div className="p-5"><EmptyState title="No documents found" description="Upload a document or change your search." action={<Button variant="outline" onClick={() => setSearch("")}><Upload size={15} /> Clear search</Button>} /></div> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[660px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Document","Status","Chunks","Uploaded","Actions"].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((doc) => <tr key={doc.id} className="hover:bg-slate-50/70"><td className="px-4 py-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-rose-50 p-2 text-rose-600"><FileText size={17} /></div><div><p className="max-w-[230px] truncate font-medium text-slate-800">{doc.name}</p><p className="mt-1 text-xs text-slate-400">{doc.content_type ?? "Document"}</p></div></div></td><td className="px-4 py-4"><DocumentStatus status={doc.status} /></td><td className="px-4 py-4 text-slate-600">{doc.chunk_count ?? "—"}</td><td className="px-4 py-4 text-xs text-slate-500">{formatDate(doc.created_at)}</td><td className="px-4 py-4"><Button variant="ghost" size="sm" disabled={remove.isPending} onClick={() => { if (window.confirm(`Delete ${doc.name}?`)) remove.mutate(doc.id); }} aria-label={`Delete ${doc.name}`}><Trash2 size={15} /></Button></td></tr>)}</tbody></table></div>
          )}
          {remove.isError && <p className="border-t border-red-100 px-4 py-3 text-sm text-red-700">{remove.error.message}</p>}
        </Card>
      </div>
    </>
  );
}
