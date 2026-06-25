import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { GET as meGet } from "@/app/api/client/me/route";
import { POST as feedbackPost } from "@/app/api/client/matches/[id]/feedback/route";
import { POST as verifyPost } from "@/app/api/client/auth/verify/route";
import { isDatabaseAvailable, integrationPrisma, disconnectIntegrationDb } from "./helpers/db";
import { createIntroPairFixture, deleteIntroPairFixture } from "./helpers/fixtures";
import { loginClientWithMagicLink } from "./helpers/auth";

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)("integration: idor", () => {
  let fixture: Awaited<ReturnType<typeof createIntroPairFixture>>;

  beforeAll(async () => {
    fixture = await createIntroPairFixture(integrationPrisma);
  });

  afterAll(async () => {
    await deleteIntroPairFixture(integrationPrisma, fixture);
    await disconnectIntegrationDb();
  });

  it("client A /api/client/me never returns client B profile", async () => {
    await loginClientWithMagicLink(integrationPrisma, fixture.clientA.clientId, verifyPost);
    const meRes = await meGet();
    const meBody = await meRes.json();
    expect(meBody.customer.id).toBe(fixture.clientA.customerId);
    expect(meBody.customer.id).not.toBe(fixture.clientB.customerId);
  });

  it("client A cannot accept client B intro suggestion", async () => {
    await loginClientWithMagicLink(integrationPrisma, fixture.clientA.clientId, verifyPost);
    const res = await feedbackPost(
      new Request("http://localhost/api/client/matches/x/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "accept" }),
      }),
      { params: Promise.resolve({ id: fixture.clientB.suggestionId }) }
    );
    expect(res.status).toBe(404);
  });
});
