"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationsBell() {
  const [unread, setUnread] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<
    Array<{ id: string; type: string; payload: Record<string, unknown>; createdAt: string }>
  >([]);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setUnread(data.unread ?? 0);
    setItems(data.items ?? []);
  }, []);

  React.useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  async function markRead() {
    await fetch("/api/notifications", { method: "PATCH", body: "{}" });
    setUnread(0);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative text-ink-mute hover:text-ink cursor-pointer"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 size-2 rounded-full bg-vermilion" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-72 border border-ink/12 bg-paper p-4 shadow-none z-50">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute mb-3">
            Notifications
          </div>
          {items.length === 0 ? (
            <p className="text-[13px] text-ink-mute italic">Nothing new.</p>
          ) : (
            <ul className="space-y-3 max-h-64 overflow-auto">
              {items.slice(0, 8).map((n) => (
                <li key={n.id} className="text-[13px] text-ink-warm">
                  {n.type === "mention" && <>Mentioned on {String(n.payload.customerName)}</>}
                  {n.type === "handoff" && <>Handoff: {String(n.payload.customerName)}</>}
                  {n.type === "match_feedback" && (
                    <>
                      {String(n.payload.candidateName)} — {String(n.payload.status)}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={markRead}
            className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute hover:text-vermilion"
          >
            Mark all read
          </button>
        </div>
      )}
    </div>
  );
}

export function OpsNavLink({ role }: { role?: string }) {
  if (role !== "ops" && role !== "owner") return null;
  return (
    <Link
      href="/ops"
      className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute hover:text-ink-warm hidden md:inline"
    >
      Ops
    </Link>
  );
}
