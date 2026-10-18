import { useRef, useState } from "react";
import { FileUp } from "lucide-react";
import Button from "../ui/Button";

export default function UploadDropzone({ onUpload, busy }: { onUpload: (file: File) => void; busy?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  function accept(file?: File) {
    if (file) onUpload(file);
  }
  return (
    <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files[0]); }} className={`rounded-2xl border-2 border-dashed p-7 text-center transition ${dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-slate-50"}`}>
      <input ref={input} type="file" accept=".pdf,.txt,.md,.docx" className="hidden" onChange={(e) => accept(e.target.files?.[0])} />
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-indigo-700 shadow-sm"><FileUp size={22} /></div>
      <p className="mt-3 text-sm font-semibold text-slate-800">Upload documents</p>
      <p className="mt-1 text-xs text-slate-500">Drag a PDF, TXT, Markdown, or DOCX file here</p>
      <p className="mt-1 text-[11px] text-slate-400">File size and type must also be validated by the backend.</p>
      <Button className="mt-4" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Uploading..." : "Choose file"}</Button>
    </div>
  );
}
