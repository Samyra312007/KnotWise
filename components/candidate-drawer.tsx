"use client";

import * as React from "react";
import { BiodataCard } from "@/components/biodata-card";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Biodata } from "@/lib/types";

export function CandidateDrawer({
  candidateId,
  open,
  onClose,
}: {
  candidateId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [profile, setProfile] = React.useState<(Biodata & { id: string }) | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !candidateId) return;
    setLoading(true);
    setProfile(null);
    fetch(`/api/pool/${candidateId}`)
      .then((r) => r.json())
      .then((d) => setProfile(d.profile))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [open, candidateId]);

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      <DialogTitle>Candidate profile</DialogTitle>
      <div className="mt-8">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : profile ? (
          <BiodataCard biodata={profile} />
        ) : (
          <p className="text-ink-mute italic">Could not load this profile.</p>
        )}
      </div>
    </Dialog>
  );
}
