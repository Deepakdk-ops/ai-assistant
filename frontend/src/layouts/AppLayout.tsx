import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import RealtimeBridge from "../components/layout/RealtimeBridge";

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  return (
    <div className="min-h-screen bg-slate-50">
      <RealtimeBridge />
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex"><Sidebar /></div>
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/60" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation backdrop" />
          <div className="relative h-full w-72"><Sidebar mobile onNavigate={() => setMobileNavOpen(false)} /></div>
        </div>
      )}
      <div className="lg:pl-64">
        <Topbar onMenu={() => setMobileNavOpen(true)} />
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
