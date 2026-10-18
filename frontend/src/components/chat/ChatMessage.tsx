import { Bot, User, FileText } from "lucide-react";
import type { Citation } from "../../types/chat";

export interface MessageView {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  insufficient_evidence?: boolean;
}

export default function ChatMessage({ message }: { message: MessageView }) {
  const user = message.role === "user";
  return (
    <div className={`flex gap-3 ${user ? "flex-row-reverse" : ""}`}>
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${user ? "bg-slate-200 text-slate-700" : "bg-indigo-100 text-indigo-700"}`}>{user ? <User size={17} /> : <Bot size={18} />}</div>
      <div className={`max-w-[88%] min-w-0 ${user ? "text-right" : ""}`}>
        <div className={`inline-block rounded-2xl px-4 py-3 text-left text-sm leading-6 ${user ? "bg-brand-700 text-white" : "border border-slate-200 bg-white text-slate-800"}`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {!user && message.insufficient_evidence && <p className="mt-2 text-xs text-amber-700">Insufficient evidence in the selected sources.</p>}
        {!user && message.citations && message.citations.length > 0 && (
          <div className="mt-3 space-y-2 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sources · {message.citations.length}</p>
            {message.citations.map((citation) => (
              <details key={`${citation.document_id}-${citation.chunk_id}`} className="rounded-xl border border-slate-200 bg-white">
                <summary className="flex cursor-pointer list-none items-center gap-2 p-3 text-xs font-medium text-slate-700">
                  <FileText size={15} className="text-indigo-600" /><span className="min-w-0 flex-1 truncate">{citation.title}</span><span className="text-slate-400">{citation.page ? `p. ${citation.page}` : "Source"}</span>
                </summary>
                <p className="border-t border-slate-100 px-3 py-3 text-xs leading-5 text-slate-600">{citation.excerpt}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
