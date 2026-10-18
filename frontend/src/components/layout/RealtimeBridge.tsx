import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "../../lib/api-client";

export default function RealtimeBridge() {
  const queryClient = useQueryClient();
  useEffect(() => {
    let socket: WebSocket | undefined; let retryTimer: number | undefined; let disposed = false; let delay = 1000;
    function connect() {
      if (disposed) return;
      const token = getAccessToken();
      if (!token) { window.dispatchEvent(new CustomEvent("workspace:realtime", { detail: "disconnected" })); retryTimer = window.setTimeout(connect, 3000); return; }
      const base = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
      const wsBase = base.startsWith("/") ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}${base}` : base.replace(/^http/, "ws");
      socket = new WebSocket(`${wsBase}/ws/events?token=${encodeURIComponent(token)}`);
      socket.onopen = () => { delay = 1000; window.dispatchEvent(new CustomEvent("workspace:realtime", { detail: "connected" })); };
      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data);
          window.dispatchEvent(new CustomEvent("workspace:task-event", { detail: event }));
          if (["document"].includes(event.type)) queryClient.invalidateQueries({ queryKey: ["documents"] });
          if (["evaluation"].includes(event.type)) queryClient.invalidateQueries({ queryKey: ["evaluation-runs"] });
          if (["agent"].includes(event.type)) queryClient.invalidateQueries({ queryKey: ["agent-run", event.resource_id] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
        } catch { /* ignore malformed messages */ }
      };
      socket.onerror = () => window.dispatchEvent(new CustomEvent("workspace:realtime", { detail: "unavailable" }));
      socket.onclose = () => { window.dispatchEvent(new CustomEvent("workspace:realtime", { detail: "disconnected" })); if (!disposed) { retryTimer = window.setTimeout(connect, delay); delay = Math.min(delay * 2, 15000); } };
    }
    connect();
    return () => { disposed = true; if (retryTimer) window.clearTimeout(retryTimer); socket?.close(); };
  }, [queryClient]);
  return null;
}
