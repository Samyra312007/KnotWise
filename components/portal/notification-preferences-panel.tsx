"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Preferences = {
  introPush: boolean;
  messagePush: boolean;
  reminderPush: boolean;
};

type DryRunEntry = {
  title: string;
  body: string;
  data: Record<string, unknown>;
};

export function NotificationPreferencesPanel() {
  const [prefs, setPrefs] = React.useState<Preferences | null>(null);
  const [devices, setDevices] = React.useState<Array<{ id: string; platform: string; tokenPreview: string }>>([]);
  const [dryRun, setDryRun] = React.useState(false);
  const [recentDryRun, setRecentDryRun] = React.useState<DryRunEntry[]>([]);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    return Promise.all([
      fetch("/api/client/notifications/preferences").then((r) => r.json()),
      fetch("/api/client/devices").then((r) => r.json()),
    ]).then(([prefData, deviceData]) => {
      setPrefs(prefData.preferences);
      setDryRun(Boolean(prefData.dryRun));
      setRecentDryRun(prefData.recentDryRun ?? []);
      setDevices(deviceData.devices ?? []);
    });
  }, []);

  React.useEffect(() => {
    load().catch(() => toast.error("Could not load notification settings."));
  }, [load]);

  async function save(next: Preferences) {
    setBusy(true);
    try {
      const res = await fetch("/api/client/notifications/preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Could not save preferences.");
        return;
      }
      setPrefs(data.preferences);
      toast.success("Notification preferences saved.");
    } finally {
      setBusy(false);
    }
  }

  if (!prefs) return <p className="text-ink-mute italic">Loading…</p>;

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <PreferenceRow
          label="New intros"
          description="When your matchmaker sends a new profile intro."
          checked={prefs.introPush}
          disabled={busy}
          onChange={(introPush) => save({ ...prefs, introPush })}
        />
        <PreferenceRow
          label="Chat messages"
          description="When someone messages you after a mutual match."
          checked={prefs.messagePush}
          disabled={busy}
          onChange={(messagePush) => save({ ...prefs, messagePush })}
        />
        <PreferenceRow
          label="Date reminders"
          description="Upcoming scheduled dates and video calls."
          checked={prefs.reminderPush}
          disabled={busy}
          onChange={(reminderPush) => save({ ...prefs, reminderPush })}
        />
      </div>

      <div className="border border-ink/12 p-4 space-y-3">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Registered devices</h2>
        {devices.length === 0 ? (
          <p className="text-[14px] text-ink-mute italic">
            No push tokens yet. Open the KnotWise mobile app to register this account for push notifications.
          </p>
        ) : (
          devices.map((device) => (
            <div key={device.id} className="flex items-center justify-between text-[14px]">
              <span className="capitalize">{device.platform}</span>
              <span className="font-mono text-[11px] text-ink-mute">{device.tokenPreview}</span>
            </div>
          ))
        )}
      </div>

      {dryRun ? (
        <div className="border border-ink/12 p-4 space-y-3">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Dry-run log (dev)</h2>
          {recentDryRun.length === 0 ? (
            <p className="text-[14px] text-ink-mute italic">Push events will appear here while PUSH_DRY_RUN is enabled.</p>
          ) : (
            recentDryRun.map((entry, index) => (
              <div key={`${entry.title}-${index}`} className="text-[14px] border-l-2 border-vermilion/40 pl-3">
                <div className="font-medium">{entry.title}</div>
                <div className="text-ink-mute">{entry.body}</div>
              </div>
            ))
          )}
          <Button variant="quiet" size="compact" onClick={() => load()}>
            Refresh log
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function PreferenceRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-6 border border-ink/12 p-4 cursor-pointer">
      <span>
        <span className="block text-[14px] text-ink">{label}</span>
        <span className="block mt-1 text-[13px] text-ink-mute">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 accent-vermilion"
      />
    </label>
  );
}
