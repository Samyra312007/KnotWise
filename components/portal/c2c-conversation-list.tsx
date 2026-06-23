"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";

type ConversationItem = {
  id: string;
  mutualMatchId: string;
  blocked: boolean;
  counterpart: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
  };
  lastMessage?: {
    body: string;
    createdAt: string;
    mine: boolean;
  } | null;
};

export function C2cConversationList() {
  const [items, setItems] = React.useState<ConversationItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/c2c/conversations")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-ink-mute italic">Loading…</p>;

  if (items.length === 0) {
    return (
      <p className="text-ink-mute italic">
        No mutual chats yet. When you and a match both accept an intro, chat unlocks here.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="border-t border-ink/12 pt-4">
          <Link href={`/portal/chat/${item.id}`} className="flex items-center gap-4 group">
            {item.counterpart.photoUrl ? (
              <img
                src={item.counterpart.photoUrl}
                alt=""
                className="size-12 object-cover border border-ink/12"
              />
            ) : (
              <div className="size-12 border border-ink/12 bg-paper-quiet" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display-tight text-[18px] text-ink group-hover:text-vermilion">
                  {item.counterpart.firstName} {item.counterpart.lastName}
                </span>
                {item.lastMessage ? (
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-mute shrink-0">
                    {format(new Date(item.lastMessage.createdAt), "d MMM")}
                  </span>
                ) : null}
              </div>
              {item.lastMessage ? (
                <p className="mt-1 text-[13px] text-ink-warm truncate">
                  {item.lastMessage.mine ? "You: " : ""}
                  {item.lastMessage.body}
                </p>
              ) : (
                <p className="mt-1 text-[13px] text-ink-mute italic">Say hello</p>
              )}
              {item.blocked ? (
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-vermilion">Blocked</p>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
