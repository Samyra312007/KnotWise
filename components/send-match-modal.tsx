"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Knot } from "@/components/ui/knot";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScoredCandidate } from "@/lib/types";

export interface SendMatchModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerFirstName: string;
  candidate: ScoredCandidate | null;
  onSent: (sentAt: string, candidateId: string) => void;
}

export function SendMatchModal({
  open,
  onClose,
  customerId,
  customerFirstName,
  candidate,
  onSent,
}: SendMatchModalProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [source, setSource] = React.useState<"llm" | "fallback" | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [successAt, setSuccessAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!open || !candidate) return;
    setLoading(true);
    setSubject("");
    setBody("");
    setSource(null);
    let alive = true;
    fetch("/api/ai/intro-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ customerId, candidateId: candidate.candidate.id }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d?.subject && d?.body) {
          setSubject(d.subject);
          setBody(d.body);
          setSource(d.source ?? "fallback");
        }
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [open, candidate, customerId]);

  async function send() {
    if (!candidate || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/matches/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerId,
          candidateId: candidate.candidate.id,
          subject,
          body,
        }),
      });
      if (!res.ok) throw new Error("send_failed");
      setSuccessAt(Date.now());
      onSent(new Date().toISOString(), candidate.candidate.id);
      setTimeout(() => {
        setSuccessAt(null);
        onClose();
        toast.success(`Sent to ${customerFirstName}.`);
        router.refresh();
      }, 900);
    } catch {
      toast.error("Could not send. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!candidate) return null;

  return (
    <>
      <Dialog open={open && !successAt} onClose={onClose}>
        <DialogTitle>
          Introduce {candidate.candidate.firstName} to {customerFirstName}.
        </DialogTitle>
        <DialogDescription>
          This is a draft. You can edit anything before sending.
        </DialogDescription>

        <div className="mt-8 space-y-6">
          <div>
            <Label htmlFor="subject">Subject</Label>
            {loading ? (
              <Skeleton className="h-11 w-full" />
            ) : (
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            )}
          </div>
          <div>
            <Label htmlFor="body">Body</Label>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className={i === 7 ? "h-4 w-1/2" : "h-4 w-full"} />
                ))}
              </div>
            ) : (
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[280px]"
              />
            )}
          </div>

          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
            {source === "llm" ? "Drafted by the AI" : source === "fallback" ? "Written from template" : "Drafting..."}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between gap-4">
          <Button variant="quiet" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="accent"
            onClick={send}
            loading={submitting}
            disabled={loading || !subject.trim() || !body.trim()}
          >
            Send to {customerFirstName}
          </Button>
        </div>
      </Dialog>

      {successAt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-paper anim-reveal-quiet"
          aria-hidden
        >
          <div className="text-vermilion">
            <Knot size={320} animate strokeWidth={2.4} />
          </div>
        </div>
      )}
    </>
  );
}
