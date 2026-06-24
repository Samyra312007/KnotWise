import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { urlsForPayload, portalUrl, deepLink } from "@/lib/push/deep-links";
import { isExpoPushToken } from "@/lib/push/expo";
import { sendExpoPushBatch } from "@/lib/push/expo";

describe("push deep links", () => {
  const env = { ...process.env };

  beforeEach(() => {
    process.env.CLIENT_PORTAL_URL = "https://app.knotwise.in/portal";
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it("builds intro urls", () => {
    const links = urlsForPayload({ type: "intro", suggestionId: "sug-1" });
    expect(links.url).toBe("https://app.knotwise.in/portal/matches/sug-1");
    expect(links.deepLink).toBe("knotwise://portal/matches/sug-1");
  });

  it("builds message urls", () => {
    const links = urlsForPayload({ type: "message", conversationId: "conv-1", preview: "Hi" });
    expect(links.url).toBe("https://app.knotwise.in/portal/chat/conv-1");
    expect(deepLink("portal/chat/conv-1")).toBe("knotwise://portal/chat/conv-1");
  });

  it("builds portal base urls", () => {
    expect(portalUrl("/matches")).toBe("https://app.knotwise.in/portal/matches");
  });
});

describe("expo push tokens", () => {
  it("recognizes expo token formats", () => {
    expect(isExpoPushToken("ExponentPushToken[abc]")).toBe(true);
    expect(isExpoPushToken("ExpoPushToken[abc]")).toBe(true);
    expect(isExpoPushToken("invalid")).toBe(false);
  });
});

describe("expo push dry run", () => {
  const env = { ...process.env };

  beforeEach(() => {
    globalThis.__knotwisePushDryRunLog = undefined;
    process.env.PUSH_DRY_RUN = "true";
  });

  afterEach(() => {
    process.env = { ...env };
    globalThis.__knotwisePushDryRunLog = undefined;
  });

  it("records dry-run pushes without network", async () => {
    const result = await sendExpoPushBatch([
      {
        to: "ExponentPushToken[test]",
        title: "Hello",
        body: "World",
        data: { type: "intro", suggestionId: "s1", url: portalUrl("/matches/s1"), deepLink: deepLink("portal/matches/s1") },
      },
    ]);
    expect(result.sent).toBe(1);
    expect(globalThis.__knotwisePushDryRunLog?.length).toBe(1);
  });
});
