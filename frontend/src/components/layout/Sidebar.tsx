import { NavLink, useNavigate } from "react-router-dom";
import { apiClient, setAccessToken } from "../../lib/api-client";
import {
  Activity, Bot, BrainCircuit, Database, FileText, LayoutDashboard,
  MessageSquare, Settings, Workflow, Sparkles, PanelLeftClose, BookOpen, LogOut
} from "lucide-react";
import { cn } from "../../lib/utils";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "AI Chat", icon: MessageSquare },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/knowledge-base", label: "Knowledge base", icon: Database },
  { to: "/agents", label: "AI Agents", icon: Bot },
  { to: "/evaluations", label: "Evaluations", icon: Activity },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/tutorial", label: "Tutorial", icon: BookOpen },
];

export default function Sidebar({ onNavigate, mobile = false }: { onNavigate?: () => void; mobile?: boolean }) {
  const navigate = useNavigate();
  async function logout() {
    try { await apiClient.post("/auth/logout"); } catch { /* clear local session even if API is unavailable */ }
    setAccessToken(null);
    navigate("/login", { replace: true });
    onNavigate?.();
  }
  return (
    <aside className={cn("flex h-full w-64 shrink-0 flex-col bg-slate-950 text-slate-300", mobile && "w-full")}>
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white"><BrainCircuit size={20} /></div>
        <div><p className="text-sm font-semibold text-white">AI Workspace</p><p className="text-[11px] text-slate-400">RAG + Agentic AI</p></div>
        <Sparkles className="ml-auto text-indigo-300" size={17} />
      </div>
      <div className="px-3 pt-5">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={onNavigate} className={({ isActive }) => cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
              isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/30" : "text-slate-400 hover:bg-white/5 hover:text-white",
            )}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-white"><Workflow size={15} className="text-teal-300" />Local-first mode</div>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">Build and evaluate with local models. Connect hosted services only when needed.</p>
        </div>
        <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-indigo-500 text-xs font-bold text-white">DK</div>
          <div className="min-w-0"><p className="truncate text-xs font-medium text-white">Workspace Admin</p><p className="text-[11px] text-slate-500">Portfolio project</p></div>
          <button type="button" aria-label="Log out" onClick={logout} className="ml-auto rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );
}
