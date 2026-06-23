"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function MessagesTab({ customerId }: { customerId: string }) {
  const [messages, setMessages] = React.useState<
    Array<{ id: string; authorType: string; body: string; createdAt: string }>
  >([]);
  const [body, setBody] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/customers/${customerId}/messages`);
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  React.useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  async function send() {
    if (!body.trim()) return;
    const res = await fetch(`/api/customers/${customerId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      toast.error("Could not send.");
      return;
    }
    const data = await res.json();
    setMessages((prev) => [...prev, data.message]);
    setBody("");
  }

  return (
    <div className="max-w-2xl">
      <div className="space-y-6 min-h-[240px]">
        {loading ? (
          <p className="text-ink-mute italic">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-ink-mute italic">No messages yet. Start the thread with your client.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={
                m.authorType === "matchmaker"
                  ? "border-l-2 border-vermilion pl-4"
                  : "border-l-2 border-ink/20 pl-4"
              }
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute mb-1">
                {m.authorType === "matchmaker" ? "You" : "Client"} —{" "}
                {format(new Date(m.createdAt), "d MMM, HH:mm")}
              </div>
              <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">{m.body}</p>
            </div>
          ))
        )}
      </div>
      <div className="mt-10 space-y-4">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[120px]"
        />
        <Button variant="accent" onClick={send}>
          Send message
        </Button>
      </div>
    </div>
  );
}
