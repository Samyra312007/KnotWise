import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST as checkoutPost } from "@/app/api/client/billing/checkout/route";
import { POST as verifyPost } from "@/app/api/client/auth/verify/route";
import { isDatabaseAvailable, integrationPrisma, disconnectIntegrationDb } from "./helpers/db";
import { createIntroPairFixture, deleteIntroPairFixture } from "./helpers/fixtures";
import { loginClientWithMagicLink } from "./helpers/auth";

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)("integration: billing dry-run", () => {
  let fixture: Awaited<ReturnType<typeof createIntroPairFixture>>;

  beforeAll(async () => {
    process.env.RAZORPAY_DRY_RUN = "true";
    fixture = await createIntroPairFixture(integrationPrisma);
  });

  afterAll(async () => {
    await deleteIntroPairFixture(integrationPrisma, fixture);
    await disconnectIntegrationDb();
  });

  it("activates plus plan via Razorpay dry-run checkout", async () => {
    await loginClientWithMagicLink(integrationPrisma, fixture.clientA.clientId, verifyPost);
    const key = `int-billing-${Date.now()}`;
    const res = await checkoutPost(
      new Request("http://localhost/api/client/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: "plus", idempotencyKey: key }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    const billing = await integrationPrisma.clientBilling.findUnique({
      where: { customerId: fixture.clientA.customerId },
    });
    expect(billing?.plan).toBe("plus");
    expect(billing?.status).toBe("active");
  });
});
