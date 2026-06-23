"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type PendingRevision = {
  id: string;
  fieldPath: string;
  status: string;
};

export default function PortalProfilePage() {
  const [profile, setProfile] = React.useState<Record<string, unknown> | null>(null);
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [photos, setPhotos] = React.useState<Array<{ id: string; url: string }>>([]);
  const [pending, setPending] = React.useState<PendingRevision[]>([]);
  const [changeRequest, setChangeRequest] = React.useState("");
  const [stage, setStage] = React.useState("");

  React.useEffect(() => {
    fetch("/api/client/profile")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.profile);
        setPhotoUrl(d.photoUrl ?? null);
        setPhotos(d.photos ?? []);
        setPending(d.pendingRevisions ?? []);
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
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-display-m text-ink">Your profile</h1>
          <p className="mt-2 text-ink-mute">Stage: {stage}</p>
        </div>
        <Link
          href="/portal/profile/edit"
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion border border-vermilion/40 px-4 py-2"
        >
          Edit profile
        </Link>
      </div>

      {pending.length > 0 ? (
        <div className="mt-8 border border-amber-600/30 bg-amber-50/50 px-4 py-3 text-[14px] text-ink-warm">
          {pending.length} update{pending.length === 1 ? "" : "s"} pending matchmaker review.
        </div>
      ) : null}

      <div className="mt-10 flex gap-6 items-start">
        {photoUrl ? (
          <img src={photoUrl} alt="Profile" className="size-28 object-cover border border-ink/12 shrink-0" />
        ) : null}
        <dl className="grid grid-cols-2 gap-4 text-[14px] flex-1">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Name</dt>
            <dd>
              {String(profile.firstName)} {String(profile.lastName)}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">City</dt>
            <dd>{String(profile.city)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Religion</dt>
            <dd>{String(profile.religion || "—")}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Community</dt>
            <dd>{String(profile.caste || "—")}</dd>
          </div>
          <div className="col-span-2">
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Bio</dt>
            <dd className="italic text-ink-warm">{String(profile.bio ?? "—")}</dd>
          </div>
        </dl>
      </div>

      {photos.length > 1 ? (
        <div className="mt-10">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mb-4">Photo album</h2>
          <ul className="flex flex-wrap gap-2">
            {photos.map((p) => (
              <li key={p.id}>
                <img src={p.url} alt="" className="size-16 object-cover border border-ink/12" />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-12">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mb-4">
          Ask matchmaker for help
        </h2>
        <Textarea
          value={changeRequest}
          onChange={(e) => setChangeRequest(e.target.value)}
          className="min-h-[120px]"
          placeholder="Need a change your matchmaker should handle manually?"
        />
        <Button variant="quiet" className="mt-4" onClick={requestChange}>
          Submit request
        </Button>
      </div>
    </section>
  );
}
