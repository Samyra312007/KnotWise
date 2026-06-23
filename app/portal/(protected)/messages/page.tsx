"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useThreadRealtime } from "@/lib/hooks/use-thread-realtime";
import { useRealtimeConfig } from "@/lib/hooks/use-realtime-config";

type ThreadMessage = {
  id: string;
  authorType: string;
  body: string;
  createdAt: string;
};

export default function PortalMessagesPage() {
  const [threadId, setThreadId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ThreadMessage[]>([]);
  const [body, setBody] = React.useState("");
  const realtimeConfig = useRealtimeConfig();

  React.useEffect(() => {
    fetch("/api/client/messages")
      .then((r) => r.json())
      .then((d) => {
        setThreadId(d.threadId ?? null);
        setMessages(d.messages ?? []);
      });
  }, []);

  const appendMessage = React.useCallback((message: ThreadMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }, []);

  useThreadRealtime({
    threadId,
    enabled: Boolean(threadId) && realtimeConfig?.mode !== "poll",
    onMessage: appendMessage,
  });

  React.useEffect(() => {
    if (realtimeConfig?.mode !== "poll") return;
    const timer = window.setInterval(() => {
      fetch("/api/client/messages")
        .then((r) => r.json())
        .then((d) => {
          if (d.messages) setMessages(d.messages);
        })
        .catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [realtimeConfig?.mode]);

  async function send() {
    const res = await fetch("/api/client/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      toast.error("Could not send.");
      return;
    }
    const data = await res.json();
    appendMessage(data.message);
    setBody("");
  }

  return (
    <section>
      <h1 className="font-display text-display-m text-ink">Matchmaker messages</h1>
      <p className="mt-2 text-[14px] text-ink-mute">Private thread with your assigned matchmaker.</p>
      <div className="mt-10 space-y-6">
        {messages.map((m) => (
          <div key={m.id} className="border-l-2 border-ink/20 pl-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
              {m.authorType === "client" ? "You" : "Matchmaker"} —{" "}
              {format(new Date(m.createdAt), "d MMM, HH:mm")}
            </div>
            <p className="mt-2 text-[14px] whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 space-y-4">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[120px]" />
        <Button variant="accent" onClick={send}>
          Send
        </Button>
      </div>
    </section>
  );
}
