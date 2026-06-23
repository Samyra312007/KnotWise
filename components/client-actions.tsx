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
          "h-9 px-4 font-mono text-[10px] uppercase tracking-[0.18em] bg-paper-quiet border border-ink/24 text-ink",
      }}
      content={{
        button: "Upload photo",
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
