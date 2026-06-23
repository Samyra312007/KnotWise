"use client";

import * as React from "react";
import { toast } from "sonner";
import { UploadButton } from "@/lib/uploadthing";

export function OnboardingPhotoUpload({
  customerId,
  photoUrl,
  onUploaded,
}: {
  customerId: string;
  photoUrl?: string;
  onUploaded: (url: string) => void;
}) {
  return (
    <div className="space-y-4">
      {photoUrl ? (
        <div className="flex items-center gap-4">
          <img
            src={photoUrl}
            alt="Profile"
            className="size-24 object-cover border border-ink/12"
          />
          <p className="text-[13px] text-ink-mute">Photo added. You can replace it below.</p>
        </div>
      ) : null}
      <UploadButton
        endpoint="clientProfilePhoto"
        input={{ customerId, purpose: "onboarding" }}
        onClientUploadComplete={(res) => {
          const url = res?.[0]?.url;
          if (url) {
            onUploaded(url);
            toast.success("Photo uploaded.");
          }
        }}
        onUploadError={() => {
          toast.error("Upload failed. Check UploadThing config or paste a photo URL.");
        }}
        appearance={{
          button:
            "h-11 px-4 font-mono text-[10px] uppercase tracking-[0.18em] bg-paper-quiet border border-ink/24 text-ink cursor-pointer",
        }}
        content={{
          button: photoUrl ? "Replace photo" : "Upload photo",
        }}
      />
    </div>
  );
}
