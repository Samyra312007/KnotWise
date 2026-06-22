"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { StagePill } from "@/components/ui/stage-pill";
import { STAGES, type Stage } from "@/lib/types";

export function StageDropdown({
  customerId,
  initialStage,
}: {
  customerId: string;
  initialStage: Stage;
}) {
  const router = useRouter();
  const [stage, setStage] = React.useState<Stage>(initialStage);
  const [updating, setUpdating] = React.useState(false);

  async function update(next: Stage) {
    if (next === stage || updating) return;
    setUpdating(true);
    const previous = stage;
    setStage(next);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stage: next }),
      });
      if (!res.ok) throw new Error("update_failed");
      toast.success(`Moved to ${next}.`);
      router.refresh();
    } catch {
      setStage(previous);
      toast.error("Could not change stage. Try again.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Dropdown
      align="right"
      trigger={
        <span className="inline-flex items-center gap-2 cursor-pointer">
          <StagePill stage={stage} />
          <ChevronDown size={14} className="text-ink-mute" />
        </span>
      }
    >
      <div className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
        Change stage
      </div>
      {STAGES.map((s) => (
        <DropdownItem key={s} onSelect={() => update(s)} className="py-2.5">
          <StagePill stage={s} />
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
