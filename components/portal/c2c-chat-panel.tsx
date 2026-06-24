"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RemoteImage } from "@/components/ui/remote-image";
import { Textarea } from "@/components/ui/textarea";
import { useC2cRealtime } from "@/lib/hooks/use-c2c-realtime";
import { useRealtimeConfig } from "@/lib/hooks/use-realtime-config";
import type { C2cRealtimeEvent } from "@/lib/realtime/events";

type ChatMessage = {
  id: string;
  body: string;
  mine: boolean;
  createdAt: string;
  readAt?: string | null;
};

type ConversationMeta = {
  id: string;
  counterpart: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
  };
  blocked: boolean;
};

export function C2cChatPanel({ conversationId }: { conversationId: string }) {
  const [meta, setMeta] = React.useState<ConversationMeta | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [reportReason, setReportReason] = React.useState("");
  const [showReport, setShowReport] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const realtimeConfig = useRealtimeConfig();

  const handleRealtimeEvent = React.useCallback(
    (event: C2cRealtimeEvent) => {
      if (!meta) return;
      if (event.type === "message") {
        setMessages((prev) => {
          if (prev.some((m) => m.id === event.message.id)) return prev;
          return [
            ...prev,
            {
              id: event.message.id,
              body: event.message.body,
              mine: event.message.senderId !== meta.counterpart.id,
              createdAt: event.message.createdAt,
              readAt: event.message.readAt,
            },
          ];
        });
      }
    },
    [meta]
  );

  useC2cRealtime({
    conversationId,
    enabled: Boolean(meta) && realtimeConfig?.mode !== "poll",
    onEvent: handleRealtimeEvent,
  });

  const loadMessages = React.useCallback(() => {
    return Promise.all([
      fetch(`/api/c2c/conversations/${conversationId}`).then((r) => r.json()),
      fetch(`/api/c2c/conversations/${conversationId}/messages`).then((r) => r.json()),
    ]).then(([conversation, data]) => {
      if (conversation.error) throw new Error(conversation.error.message);
      if (data.error) throw new Error(data.error.message);
      setMeta(conversation);
      setMessages(data.messages ?? []);
    });
  }, [conversationId]);

  React.useEffect(() => {
    loadMessages().catch(() => toast.error("Could not load chat."));
  }, [loadMessages]);

  React.useEffect(() => {
    if (realtimeConfig?.mode !== "poll") return;
    const timer = window.setInterval(() => {
      fetch(`/api/c2c/conversations/${conversationId}/messages`)
        .then((r) => r.json())
        .then((d) => {
          if (d.messages) setMessages(d.messages);
        })
        .catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [conversationId, realtimeConfig?.mode]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = body.trim();
    if (!text || meta?.blocked) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/c2c/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Could not send message.");
        return;
      }
      setMessages((prev) => [...prev, data.message]);
      setBody("");
    } finally {
      setBusy(false);
    }
  }

  async function submitReport() {
    if (!meta) return;
    const res = await fetch("/api/trust/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetType: "customer",
        targetId: meta.counterpart.id,
        reason: reportReason.trim(),
      }),
    });
    if (!res.ok) {
      toast.error("Could not submit report.");
      return;
    }
    toast.success("Report submitted. Our team will review within 48 hours.");
    setReportReason("");
    setShowReport(false);
  }

  async function blockUser() {
    if (!meta) return;
    const res = await fetch("/api/c2c/block", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ blockedCustomerId: meta.counterpart.id }),
    });
    if (!res.ok) {
      toast.error("Could not block user.");
      return;
    }
    toast.success("User blocked.");
    await loadMessages();
  }

  if (!meta) return <p className="text-ink-mute italic">Loading…</p>;

  return (
    <div>
      <Link href="/portal/chat" className="font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion">
        ← All chats
      </Link>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {meta.counterpart.photoUrl ? (
            <RemoteImage src={meta.counterpart.photoUrl} alt="" width={40} height={40} className="size-10 object-cover border border-ink/12" />
          ) : null}
          <h1 className="font-display-tight text-[22px] text-ink">
            {meta.counterpart.firstName} {meta.counterpart.lastName}
          </h1>
        </div>
        {!meta.blocked ? (
          <div className="flex gap-2">
            <Button variant="quiet" size="compact" onClick={() => setShowReport((v) => !v)}>
              Report
            </Button>
            <Button variant="quiet" size="compact" onClick={blockUser}>
              Block
            </Button>
          </div>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion">Blocked</span>
        )}
      </div>

      {showReport ? (
        <div className="mt-6 space-y-3 border border-ink/12 p-4">
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Describe the issue (min 10 characters)"
            className="min-h-[80px]"
          />
          <Button variant="accent" size="compact" disabled={reportReason.trim().length < 10} onClick={submitReport}>
            Submit report
          </Button>
        </div>
      ) : null}

      <div className="mt-8 max-h-[420px] overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 ? (
          <p className="text-ink-mute italic text-[14px]">No messages yet. Say hello.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] ${m.mine ? "ml-auto text-right" : "mr-auto text-left"}`}
            >
              <div
                className={`inline-block px-4 py-3 text-[14px] whitespace-pre-wrap ${
                  m.mine ? "bg-vermilion/10 text-ink" : "bg-paper-quiet text-ink-warm border border-ink/12"
                }`}
              >
                {m.body}
              </div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-mute">
                {format(new Date(m.createdAt), "d MMM, HH:mm")}
                {m.mine && m.readAt ? " · read" : ""}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-8 space-y-4 border-t border-ink/12 pt-6">
        {meta.blocked ? (
          <p className="text-[14px] text-ink-mute italic">Messaging is disabled for this conversation.</p>
        ) : (
          <>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[100px]"
              placeholder="Write a message…"
              maxLength={4000}
            />
            <Button variant="accent" disabled={busy || !body.trim()} onClick={send}>
              Send
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
