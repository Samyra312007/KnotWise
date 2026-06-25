"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
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
      .then((d) => setMembers(d.members ?? []))
      .catch(() => toast.error("Could not load colleagues."));
  }, []);

  async function submit() {
    if (!toId) {
      toast.error("Choose a colleague.");
      return;
    }
    if (!note.trim()) {
      toast.error("Add a note for the handoff.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/handoff`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toMatchmakerId: toId, note }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error?.message ?? "failed");
      }
      toast.success("Handoff requested.");
      setNote("");
      setToId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not request handoff.");
    } finally {
      setSubmitting(false);
    }
  }

  const selected = members.find((m) => m.matchmakerId === toId);
  const canSubmit = !!toId && !!note.trim() && !submitting;

  return (
    <div className="mt-6 p-4 border border-ink/12 bg-paper-quiet space-y-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
        Hand off client
      </div>
      <div>
        <Label>Colleague</Label>
        <div className="block w-full mt-2">
          <Dropdown
            trigger={
              <span className="inline-flex items-center justify-between w-full h-11 border border-ink/24 px-3 text-[14px] cursor-pointer">
                <span>{selected?.fullName ?? "Choose colleague"}</span>
                <ChevronDown size={14} className="text-ink-mute shrink-0" />
              </span>
            }
          >
            {members.map((m) => (
              <DropdownItem key={m.matchmakerId} onSelect={() => setToId(m.matchmakerId)}>
                {m.fullName}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
      </div>
      <div>
        <Label htmlFor="handoff-note">Note (required)</Label>
        <Textarea
          id="handoff-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-2 min-h-[80px]"
        />
      </div>
      <Button
        variant="quiet"
        size="compact"
        onClick={submit}
        loading={submitting}
        disabled={!canSubmit}
      >
        Request handoff
      </Button>
    </div>
  );
}
