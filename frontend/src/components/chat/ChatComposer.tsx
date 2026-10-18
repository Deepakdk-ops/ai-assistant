import { useRef, useState } from "react";
import { ArrowUp, Paperclip } from "lucide-react";
import Button from "../ui/Button";

export default function ChatComposer({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }
  return (
    <form ref={formRef} onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <textarea value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); formRef.current?.requestSubmit(); } }} rows={2} placeholder="Ask a question about your documents..." className="w-full resize-none border-0 bg-transparent px-2 py-1 text-sm leading-6 outline-none placeholder:text-slate-400" aria-label="Message" />
      <div className="flex items-center justify-between border-t border-slate-100 pt-2">
        <span className="flex items-center gap-1.5 px-2 text-[11px] text-slate-400"><Paperclip size={14} /> Sources are checked by the backend</span>
        <Button type="submit" disabled={!value.trim() || disabled} size="sm">{disabled ? "Thinking..." : "Send"} <ArrowUp size={15} /></Button>
      </div>
    </form>
  );
}
