import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST as verifyPost } from "@/app/api/client/auth/verify/route";
import { GET as matchesGet } from "@/app/api/client/matches/route";
import { POST as feedbackPost } from "@/app/api/client/matches/[id]/feedback/route";
import { GET as billingGet } from "@/app/api/client/billing/route";
import { isDatabaseAvailable, integrationPrisma, disconnectIntegrationDb } from "./helpers/db";
import { createIntroPairFixture, deleteIntroPairFixture } from "./helpers/fixtures";
import { loginClientWithMagicLink } from "./helpers/auth";

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)("smoke: client portal", () => {
  let fixture: Awaited<ReturnType<typeof createIntroPairFixture>>;

  beforeAll(async () => {
    process.env.RAZORPAY_DRY_RUN = "true";
    fixture = await createIntroPairFixture(integrationPrisma);
  });

  afterAll(async () => {
    await deleteIntroPairFixture(integrationPrisma, fixture);
    await disconnectIntegrationDb();
  });

  it("client login, view matches, accept intro, billing loads", async () => {
    await loginClientWithMagicLink(integrationPrisma, fixture.clientA.clientId, verifyPost);

    const matchesRes = await matchesGet();
    expect(matchesRes.status).toBe(200);
    const matchesBody = await matchesRes.json();
    expect(matchesBody.items.length).toBeGreaterThan(0);

    const acceptRes = await feedbackPost(
      new Request("http://localhost/api/client/matches/x/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "accept" }),
      }),
      { params: Promise.resolve({ id: fixture.clientA.suggestionId }) }
    );
    expect(acceptRes.status).toBe(200);

    const billingRes = await billingGet();
    expect(billingRes.status).toBe(200);
  });
});
