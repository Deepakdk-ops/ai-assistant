import { Bell, Search, Menu, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient, setAccessToken } from "../../lib/api-client";

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const navigate = useNavigate();
  async function logout() { try { await apiClient.post("/auth/logout"); } catch { /* token is discarded locally regardless */ } finally { setAccessToken(null); navigate("/login", { replace: true }); } }
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-7">
      <button onClick={onMenu} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu size={20} /></button>
      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:bg-white" placeholder="Search documents, conversations, agents..." />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">Authenticated workspace</span>
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" /></button>
        <button onClick={logout} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50" title="Sign out"><LogOut size={15} /><span className="hidden sm:inline">Logout</span></button>
      </div>
    </header>
  );
}
