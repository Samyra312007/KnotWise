import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST as verifyPost } from "@/app/api/client/auth/verify/route";
import { POST as magicLinkPost } from "@/app/api/client/auth/magic-link/route";
import { GET as meGet } from "@/app/api/client/me/route";
import { isDatabaseAvailable, integrationPrisma, disconnectIntegrationDb } from "./helpers/db";
import { createIntroPairFixture, deleteIntroPairFixture } from "./helpers/fixtures";
import { loginClientWithMagicLink } from "./helpers/auth";
import { resetIntegrationCookies } from "./setup";

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)("integration: client auth", () => {
  let fixture: Awaited<ReturnType<typeof createIntroPairFixture>>;

  beforeAll(async () => {
    fixture = await createIntroPairFixture(integrationPrisma);
  });

  afterAll(async () => {
    await deleteIntroPairFixture(integrationPrisma, fixture);
    await disconnectIntegrationDb();
  });

  it("magic link + verify sets session and /api/client/me returns profile", async () => {
    const magicRes = await magicLinkPost(
      new Request("http://localhost/api/client/auth/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: fixture.clientA.email }),
      })
    );
    expect(magicRes.status).toBe(200);

    const { res: verifyRes } = await loginClientWithMagicLink(
      integrationPrisma,
      fixture.clientA.clientId,
      verifyPost
    );
    expect(verifyRes.status).toBe(200);
    const verifyBody = await verifyRes.json();
    expect(verifyBody.ok).toBe(true);

    const meRes = await meGet();
    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.customer.id).toBe(fixture.clientA.customerId);
    expect(meBody.email).toBe(fixture.clientA.email);
  });

  it("rejects invalid magic link token", async () => {
    resetIntegrationCookies();
    const res = await verifyPost(
      new Request("http://localhost/api/client/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "not-a-valid-token" }),
      })
    );
    expect(res.status).toBe(401);
  });
});
