"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/lib/uploadthing";

export function PhotoUpload({
  entityType,
  entityId,
}: {
  entityType: "customer" | "pool_profile";
  entityId: string;
}) {
  return (
    <UploadButton
      endpoint="profilePhoto"
      input={{ entityType, entityId }}
      onClientUploadComplete={() => {
        toast.success("Photo updated.");
        window.location.reload();
      }}
      onUploadError={() => {
        toast.error("Upload failed.");
      }}
      appearance={{
        button:
          "h-7 min-h-0 px-2.5 ut-upload-btn font-mono text-[9px] uppercase tracking-[0.14em] bg-transparent border border-ink/20 text-ink-mute hover:text-ink hover:border-ink/35 rounded-[2px] cursor-pointer",
        allowedContent: "hidden",
      }}
      content={{
        button: "Photo",
      }}
    />
  );
}

export function ClientInviteButton({ customerId }: { customerId: string }) {
  const [loading, setLoading] = React.useState(false);

  async function invite() {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/invite`, { method: "POST" });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      toast.success(`Portal invite sent to ${data.email}.`);
    } catch {
      toast.error("Could not send invite.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="quiet" size="compact" onClick={invite} loading={loading}>
      Invite to portal
    </Button>
  );
}
