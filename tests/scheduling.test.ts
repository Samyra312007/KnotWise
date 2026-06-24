import { describe, expect, it, afterEach } from "vitest";
import { buildIcsEvent, eventTitle, formatWhenLabel } from "@/lib/scheduling/ics";
import { isVideoDryRun } from "@/lib/scheduling/config";
import { validateStartsAt, resolveEndsAt } from "@/lib/scheduling/events";
import { createVideoRoom } from "@/lib/scheduling/video";

describe("scheduling ICS", () => {
  it("builds valid calendar content", () => {
    const startsAt = new Date("2026-07-01T10:00:00.000Z");
    const endsAt = new Date("2026-07-01T11:00:00.000Z");
    const ics = buildIcsEvent({
      uid: "evt_test",
      title: "Video call with Aanya",
      startsAt,
      endsAt,
      url: "https://example.com/reminders/evt_test",
    });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:Video call with Aanya");
    expect(ics).toContain("DTSTART:20260701T100000Z");
  });

  it("formats event titles by mode", () => {
    expect(eventTitle("video", "Rahul Sharma")).toContain("Video call");
    expect(eventTitle("in_person", "Rahul Sharma")).toContain("Meet");
  });

  it("formats when labels", () => {
    const label = formatWhenLabel(new Date("2026-07-01T10:00:00.000Z"));
    expect(label.length).toBeGreaterThan(5);
  });
});

describe("scheduling validation", () => {
  it("requires at least one hour lead time", () => {
    const tooSoon = new Date(Date.now() + 30 * 60 * 1000);
    expect(validateStartsAt(tooSoon)).toBeTruthy();
    const ok = new Date(Date.now() + 2 * 60 * 60 * 1000);
    expect(validateStartsAt(ok)).toBeNull();
  });

  it("defaults end time to one hour after start", () => {
    const start = new Date("2026-07-01T10:00:00.000Z");
    const end = resolveEndsAt(start);
    expect(end.getTime() - start.getTime()).toBe(60 * 60 * 1000);
  });
});

describe("video provider", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("defaults to dry run", () => {
    delete process.env.VIDEO_DRY_RUN;
    expect(isVideoDryRun()).toBe(true);
  });

  it("creates dry-run room links", async () => {
    process.env.VIDEO_DRY_RUN = "true";
    const room = await createVideoRoom({
      eventId: "cltest123456",
      expiresAt: new Date(Date.now() + 3600000),
    });
    expect(room.provider).toBe("dry_run");
    expect(room.url).toContain("knotwise.daily.co");
  });
});
