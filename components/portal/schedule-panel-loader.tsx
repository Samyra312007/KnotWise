"use client";

import * as React from "react";
import { SchedulePanel } from "@/components/portal/schedule-panel";

export function SchedulePanelLoader({ conversationId }: { conversationId: string }) {
  const [mutualMatchId, setMutualMatchId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`/api/c2c/conversations/${conversationId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.mutualMatchId) setMutualMatchId(d.mutualMatchId);
      })
      .catch(() => undefined);
  }, [conversationId]);

  if (!mutualMatchId) return null;
  return <SchedulePanel mutualMatchId={mutualMatchId} compact />;
}
