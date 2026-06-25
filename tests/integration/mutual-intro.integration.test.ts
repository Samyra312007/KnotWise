import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST as feedbackPost } from "@/app/api/client/matches/[id]/feedback/route";
import { POST as verifyPost } from "@/app/api/client/auth/verify/route";
import { isDatabaseAvailable, integrationPrisma, disconnectIntegrationDb } from "./helpers/db";
import { createIntroPairFixture, deleteIntroPairFixture } from "./helpers/fixtures";
import { loginClientWithMagicLink } from "./helpers/auth";

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)("integration: mutual intro", () => {
  let fixture: Awaited<ReturnType<typeof createIntroPairFixture>>;

  beforeAll(async () => {
    fixture = await createIntroPairFixture(integrationPrisma);
  });

  afterAll(async () => {
    await deleteIntroPairFixture(integrationPrisma, fixture);
    await disconnectIntegrationDb();
  });

  it("creates MutualMatch when both clients accept", async () => {
    await loginClientWithMagicLink(integrationPrisma, fixture.clientA.clientId, verifyPost);
    const acceptA = await feedbackPost(
      new Request("http://localhost/api/client/matches/x/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "accept" }),
      }),
      { params: Promise.resolve({ id: fixture.clientA.suggestionId }) }
    );
    expect(acceptA.status).toBe(200);
    const bodyA = await acceptA.json();
    expect(bodyA.status).toBe("accepted");

    await loginClientWithMagicLink(integrationPrisma, fixture.clientB.clientId, verifyPost);
    const acceptB = await feedbackPost(
      new Request("http://localhost/api/client/matches/x/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "accept" }),
      }),
      { params: Promise.resolve({ id: fixture.clientB.suggestionId }) }
    );
    expect(acceptB.status).toBe(200);
    const bodyB = await acceptB.json();
    expect(bodyB.status).toBe("mutual");
    expect(bodyB.mutualMatchId).toBeTruthy();

    const mutual = await integrationPrisma.mutualMatch.findUnique({
      where: { id: bodyB.mutualMatchId },
    });
    expect(mutual).not.toBeNull();
    expect(mutual?.status).toBe("active");
  });
});
