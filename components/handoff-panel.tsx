"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";

export function HandoffPanel({ customerId }: { customerId: string }) {
  const [members, setMembers] = React.useState<
    Array<{ matchmakerId: string; fullName: string; username: string }>
  >([]);
  const [toId, setToId] = React.useState("");
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/collaborators")
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []));
  }, []);

  async function submit() {
    if (!toId || !note.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/handoff`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toMatchmakerId: toId, note }),
      });
      if (!res.ok) throw new Error("failed");
      toast.success("Handoff requested.");
      setNote("");
    } catch {
      toast.error("Could not request handoff.");
    } finally {
      setSubmitting(false);
    }
  }

  const selected = members.find((m) => m.matchmakerId === toId);

  return (
    <div className="mt-6 p-4 border border-ink/12 bg-paper-quiet space-y-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
        Hand off client
      </div>
      <div>
        <Label>Colleague</Label>
        <Dropdown
          trigger={
            <button type="button" className="mt-2 h-11 w-full text-left border border-ink/24 px-3 text-[14px]">
              {selected?.fullName ?? "Choose colleague"}
            </button>
          }
        >
          {members.map((m) => (
            <DropdownItem key={m.matchmakerId} onSelect={() => setToId(m.matchmakerId)}>
              {m.fullName}
            </DropdownItem>
          ))}
        </Dropdown>
      </div>
      <div>
        <Label htmlFor="handoff-note">Note</Label>
        <Textarea
          id="handoff-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-2 min-h-[80px]"
        />
      </div>
      <Button variant="quiet" size="compact" onClick={submit} loading={submitting}>
        Request handoff
      </Button>
    </div>
  );
}
