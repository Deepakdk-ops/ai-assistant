import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bot, MessageSquare, Plus, ShieldCheck } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ChatComposer from "../components/chat/ChatComposer";
import ChatMessage, { type MessageView } from "../components/chat/ChatMessage";
import { askQuestion, listConversations, getConversation } from "../features/chat/api";
import { listKnowledgeBases } from "../features/knowledge-bases/api";

const starterMessages: MessageView[] = [];

export default function ChatPage() {
  const [messages, setMessages] = useState<MessageView[]>(starterMessages);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [mode, setMode] = useState<"rag" | "general">("rag");
  const [knowledgeBaseId, setKnowledgeBaseId] = useState("");
  const knowledgeBases = useQuery({ queryKey: ["knowledge-bases"], queryFn: listKnowledgeBases, retry: false });
  const [realtimeStatus, setRealtimeStatus] = useState("connecting");
  useEffect(() => {
    const update = (event: Event) => setRealtimeStatus((event as CustomEvent<string>).detail);
    window.addEventListener("workspace:realtime", update);
    return () => window.removeEventListener("workspace:realtime", update);
  }, []);
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: listConversations, retry: false });
  const chat = useMutation({
    mutationFn: askQuestion,
    onMutate: (payload) => setMessages((old) => [...old, { id: crypto.randomUUID(), role: "user", content: payload.question }]),
    onSuccess: (response) => {
      setConversationId(response.conversation_id);
      setMessages((old) => [...old, { id: crypto.randomUUID(), role: "assistant", content: response.answer, citations: response.citations, insufficient_evidence: response.insufficient_evidence }]);
    },
    onError: (error) => setMessages((old) => [...old, { id: crypto.randomUUID(), role: "assistant", content: `The request failed: ${error.message}. Check the FastAPI service and API contract.` }]),
  });
  return (
    <>
      <PageHeader title="Knowledge Assistant" description="Switch between document-grounded RAG and a general conversational AI chatbot." actions={<Button variant="outline" onClick={() => { setMessages([]); setConversationId(undefined); }}><Plus size={16} /> New chat</Button>} />
      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="hidden p-3 xl:block">
          <div className="mb-3 flex items-center justify-between px-2"><h2 className="text-sm font-semibold text-slate-800">Conversations</h2><MessageSquare size={16} className="text-slate-400" /></div>
          {conversations.isError && <p className="px-2 text-xs text-slate-500">Conversation history could not be loaded.</p>}
          <div className="space-y-1">
            {(conversations.data ?? []).map((item) => <button key={item.id} onClick={async () => { setConversationId(item.id); try { const data = await getConversation(item.id); setMessages(data.messages.map(m => ({ id: m.id, role: m.role, content: m.content, citations: m.citations, insufficient_evidence: m.insufficient_evidence }))); } catch (e) { setMessages([{ id: crypto.randomUUID(), role: "assistant", content: e instanceof Error ? e.message : "Unable to load conversation." }]); } }} className={`w-full rounded-lg px-3 py-2 text-left text-xs ${conversationId === item.id ? "bg-indigo-50 text-indigo-800" : "text-slate-600 hover:bg-slate-50"}`}>{item.title}</button>)}
          </div>
          <div className="mt-6 rounded-xl bg-slate-50 p-3"><ShieldCheck size={17} className="text-teal-700" /><p className="mt-2 text-xs font-medium text-slate-700">Evidence-first answers</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Responses should cite retrieved sources or state when evidence is insufficient.</p></div>
        </Card>
        <Card className="flex min-h-[620px] flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4"><div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><Bot size={19} /></div><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold text-slate-900">AI Chatbot</h2><p className="text-xs text-slate-500">{mode === "rag" ? "RAG mode · answers grounded in your indexed documents" : "General mode · conversational assistant"}</p></div><label className="text-xs font-medium text-slate-600">Mode <select value={mode} onChange={(e) => setMode(e.target.value as "rag" | "general")} className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5"><option value="rag">Document RAG</option><option value="general">General chatbot</option></select></label>{mode === "rag" && <label className="text-xs font-medium text-slate-600">Knowledge base <select value={knowledgeBaseId} onChange={e => setKnowledgeBaseId(e.target.value)} className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5"><option value="">All documents</option>{(knowledgeBases.data ?? []).map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}</select></label>}<span className={`rounded-full px-2.5 py-1 text-xs ${realtimeStatus === "connected" ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"}`}>Live updates: {realtimeStatus}</span></div>
          <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50/60 p-4 sm:p-6">
            {messages.length === 0 && <EmptyState title={mode === "rag" ? "Ask your documents" : "Start a conversation"} description={mode === "rag" ? "Upload and index documents first. Answers include source citations when matching evidence is found." : "Ask for explanations, brainstorming, coding help, or follow-up questions. The chatbot uses recent messages in this conversation."} />}
            {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
            {chat.isPending && <LoadingState label="Retrieving evidence and generating an answer..." />}
          </div>
          <div className="border-t border-slate-100 p-4 sm:p-5"><ChatComposer disabled={chat.isPending} onSend={(question) => chat.mutate({ question, conversation_id: conversationId, mode, knowledge_base_id: knowledgeBaseId || undefined })} /><p className="mt-2 text-center text-[11px] text-slate-400">AI output can be incorrect. Verify important claims against the cited source.</p></div>
        </Card>
      </div>
    </>
  );
}
