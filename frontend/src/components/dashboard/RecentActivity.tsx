import { FileText, MessageSquare, Bot, ArrowUpRight } from "lucide-react";
import Card from "../ui/Card";
import { Link } from "react-router-dom";

const items = [
  { icon: FileText, color: "text-rose-600 bg-rose-50", title: "Upload a document to begin", detail: "Your knowledge base starts here", time: "Next step", to: "/documents" },
  { icon: MessageSquare, color: "text-indigo-600 bg-indigo-50", title: "Ask a question", detail: "Try document-grounded Q&A", time: "Try now", to: "/chat" },
  { icon: Bot, color: "text-teal-700 bg-teal-50", title: "Run an agent workflow", detail: "Inspect tool calls and outputs", time: "Explore", to: "/agents" },
];

export default function RecentActivity() {
  return (
    <Card>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Getting started</h2><span className="text-xs text-slate-400">Quick links</span></div>
      <div className="divide-y divide-slate-100">
        {items.map(({ icon: Icon, color, title, detail, time, to }) => (
          <Link key={title} to={to} className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50">
            <div className={`rounded-xl p-2.5 ${color}`}><Icon size={18} /></div>
            <div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-800">{title}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>
            <span className="flex items-center gap-1 text-xs text-indigo-700">{time}<ArrowUpRight size={13} /></span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
