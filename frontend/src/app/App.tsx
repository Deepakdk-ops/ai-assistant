import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import DashboardPage from "../pages/DashboardPage";
import ChatPage from "../pages/ChatPage";
import DocumentsPage from "../pages/DocumentsPage";
import KnowledgeBasePage from "../pages/KnowledgeBasePage";
import AgentsPage from "../pages/AgentsPage";
import AgentRunPage from "../pages/AgentRunPage";
import EvaluationsPage from "../pages/EvaluationsPage";
import SettingsPage from "../pages/SettingsPage";
import NotFoundPage from "../pages/NotFoundPage";
import AuthPage from "../features/auth/AuthPage";
import { useEffect, useState } from "react";
import { apiClient, setAccessToken } from "../lib/api-client";
import TutorialPage from "../pages/TutorialPage";
import AccountRecoveryPage from "../features/auth/AccountRecoveryPage";

function ProtectedLayout() {
  const [state, setState] = useState<'checking'|'authenticated'|'anonymous'>('checking');
  const location = useLocation();
  useEffect(() => { let active = true; apiClient.get('/auth/me').then(() => { if (active) setState('authenticated'); }).catch(() => { setAccessToken(null); if (active) setState('anonymous'); }); return () => { active = false; }; }, []);
  if (state === 'checking') return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Checking session…</div>;
  if (state === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <AppLayout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/password-reset" element={<AccountRecoveryPage mode="reset" />} />
      <Route path="/verify-email" element={<AccountRecoveryPage mode="verify" />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/agents/runs/:runId" element={<AgentRunPage />} />
        <Route path="/evaluations" element={<EvaluationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/tutorial" element={<TutorialPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
