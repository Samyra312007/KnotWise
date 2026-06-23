"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function PortalProfilePage() {
  const [profile, setProfile] = React.useState<Record<string, unknown> | null>(null);
  const [changeRequest, setChangeRequest] = React.useState("");
  const [stage, setStage] = React.useState("");

  React.useEffect(() => {
    fetch("/api/client/profile")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.profile);
        setStage(d.stage);
      });
  }, []);

  async function requestChange() {
    const res = await fetch("/api/client/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: changeRequest }),
    });
    if (!res.ok) {
      toast.error("Could not submit request.");
      return;
    }
    toast.success("Change request sent to your matchmaker.");
    setChangeRequest("");
  }

  if (!profile) return <p className="text-ink-mute italic">Loading…</p>;

  return (
    <section>
      <h1 className="font-display text-display-m text-ink">Your profile</h1>
      <p className="mt-2 text-ink-mute">Stage: {stage}</p>
      <dl className="mt-10 grid grid-cols-2 gap-4 text-[14px]">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Name</dt>
          <dd>{String(profile.firstName)} {String(profile.lastName)}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">City</dt>
          <dd>{String(profile.city)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Bio</dt>
          <dd className="italic text-ink-warm">{String(profile.bio ?? "—")}</dd>
        </div>
      </dl>
      <div className="mt-12">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mb-4">
          Request a profile change
        </h2>
        <Textarea
          value={changeRequest}
          onChange={(e) => setChangeRequest(e.target.value)}
          className="min-h-[120px]"
        />
        <Button variant="quiet" className="mt-4" onClick={requestChange}>
          Submit request
        </Button>
      </div>
    </section>
  );
}
