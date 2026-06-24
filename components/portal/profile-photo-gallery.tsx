"use client";

import * as React from "react";
import { toast } from "sonner";
import { UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { RemoteImage } from "@/components/ui/remote-image";
import { MAX_PROFILE_PHOTOS } from "@/lib/profile/fields";

type Photo = { id: string; url: string; createdAt: string };

export function ProfilePhotoGallery({
  customerId,
  photos,
  primaryUrl,
  pendingPhotoUrl,
  onChange,
}: {
  customerId: string;
  photos: Photo[];
  primaryUrl?: string | null;
  pendingPhotoUrl?: string | null;
  onChange: () => void;
}) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const displayPrimary = pendingPhotoUrl ?? primaryUrl ?? null;

  async function removePhoto(assetId: string) {
    setBusy(assetId);
    try {
      const res = await fetch(`/api/client/profile/photos/${assetId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Could not remove photo.");
        return;
      }
      toast.success("Photo removed.");
      onChange();
    } finally {
      setBusy(null);
    }
  }

  async function setPrimary(assetId: string, url: string) {
    setBusy(assetId);
    try {
      const res = await fetch(`/api/client/profile/photos/${assetId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Could not update profile photo.");
        return;
      }
      if (data.pendingRevision) {
        toast.success("Profile photo change submitted for review.");
      } else {
        toast.success("Profile photo updated.");
      }
      onChange();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {displayPrimary ? (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute mb-2">
            Profile photo {pendingPhotoUrl ? "(pending approval)" : ""}
          </p>
          <RemoteImage src={displayPrimary} alt="Profile" width={128} height={128} className="size-32 object-cover border border-ink/12" />
        </div>
      ) : null}

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute mb-3">
          Album ({photos.length}/{MAX_PROFILE_PHOTOS})
        </p>
        {photos.length === 0 ? (
          <p className="text-[14px] text-ink-mute italic">No photos yet.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-3">
            {photos.map((p) => {
              const isPrimary = primaryUrl === p.url;
              return (
                <li key={p.id} className="relative border border-ink/12 p-2">
                  <RemoteImage src={p.url} alt="" width={200} height={200} className="aspect-square w-full object-cover" />
                  <div className="mt-2 flex flex-col gap-1">
                    {isPrimary ? (
                      <span className="font-mono text-[9px] uppercase text-vermilion">Primary</span>
                    ) : (
                      <Button
                        variant="quiet"
                        size="compact"
                        disabled={busy === p.id}
                        onClick={() => setPrimary(p.id, p.url)}
                      >
                        Set as profile
                      </Button>
                    )}
                    <Button
                      variant="quiet"
                      size="compact"
                      disabled={busy === p.id}
                      onClick={() => removePhoto(p.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {photos.length < MAX_PROFILE_PHOTOS ? (
        <UploadButton
          endpoint="clientProfilePhoto"
          input={{ customerId, purpose: "gallery" }}
          onClientUploadComplete={() => {
            toast.success("Photo added to album.");
            onChange();
          }}
          onUploadError={() => {
            toast.error("Upload failed.");
          }}
          appearance={{
            button:
              "h-11 px-4 font-mono text-[10px] uppercase tracking-[0.18em] bg-paper-quiet border border-ink/24 text-ink cursor-pointer",
          }}
          content={{ button: "Add photo" }}
        />
      ) : (
        <p className="text-[13px] text-ink-mute">Album full. Remove a photo to add another.</p>
      )}

      <p className="text-[13px] text-ink-mute">
        Changing your profile photo is reviewed by our team within 48 hours. New album photos appear immediately.
      </p>
    </div>
  );
}
