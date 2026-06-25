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
import { draftIntroEmailFallback } from "@/lib/ai/fallback";
import type { Biodata, ScoredCandidate } from "@/lib/types";

export interface SendMatchModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerFirstName: string;
  candidate: ScoredCandidate | null;
  onSent: (sentAt: string, candidateId: string) => void;
}

function applyFallbackDraft(customerFirstName: string, candidate: ScoredCandidate) {
  const clientStub = { firstName: customerFirstName } as Biodata;
  const fb = draftIntroEmailFallback(clientStub, candidate.candidate);
  return { subject: fb.subject, body: fb.body, source: "fallback" as const };
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
  const [draftFailed, setDraftFailed] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [successAt, setSuccessAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!open || !candidate) return;
    setLoading(true);
    setSubject("");
    setBody("");
    setSource(null);
    setDraftFailed(false);
    let alive = true;

    fetch("/api/ai/intro-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerId,
        candidateId: candidate.candidate.id,
        useExisting: candidate.alreadySent,
      }),
    })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!alive) return;
        if (r.ok && d?.subject && d?.body) {
          setSubject(d.subject);
          setBody(d.body);
          setSource(d.source === "existing" ? "fallback" : (d.source ?? "fallback"));
          return;
        }
        const fb = applyFallbackDraft(customerFirstName, candidate);
        setSubject(fb.subject);
        setBody(fb.body);
        setSource(fb.source);
        setDraftFailed(true);
        toast.error(
          d?.error?.message ?? "Could not draft email — a template was loaded instead."
        );
      })
      .catch(() => {
        if (!alive) return;
        const fb = applyFallbackDraft(customerFirstName, candidate);
        setSubject(fb.subject);
        setBody(fb.body);
        setSource(fb.source);
        setDraftFailed(true);
        toast.error("Could not draft email — a template was loaded instead.");
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [open, candidate, customerId, customerFirstName]);

  async function postSend(overrideSameGotra = false): Promise<boolean> {
    if (!candidate) return false;
    const res = await fetch("/api/matches/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerId,
        candidateId: candidate.candidate.id,
        subject,
        body,
        overrideSameGotra: overrideSameGotra || undefined,
      }),
    });

    if (res.status === 409) {
      const d = await res.json().catch(() => null);
      if (d?.error?.code === "SAME_GOTRA" && d.canOverride) {
        const msg = d.gotraWarning ?? "Same gotra — send anyway?";
        if (window.confirm(msg)) {
          return postSend(true);
        }
        return false;
      }
    }

    if (!res.ok) {
      const d = await res.json().catch(() => null);
      toast.error(d?.error?.message ?? "Could not send. Try again.");
      return false;
    }

    return true;
  }

  async function send() {
    if (!candidate || submitting) return;
    setSubmitting(true);
    try {
      const ok = await postSend();
      if (!ok) return;
      setSuccessAt(Date.now());
      onSent(new Date().toISOString(), candidate.candidate.id);
      setTimeout(() => {
        setSuccessAt(null);
        onClose();
        toast.success(`Sent to ${customerFirstName}.`);
        router.refresh();
      }, 900);
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
            {loading
              ? "Drafting..."
              : draftFailed
                ? "Draft unavailable — edit below or retry"
                : source === "llm"
                  ? "Drafted by the AI"
                  : source === "fallback"
                    ? candidate.alreadySent
                      ? "Loaded from sent log"
                      : "Written from template"
                    : ""}
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
