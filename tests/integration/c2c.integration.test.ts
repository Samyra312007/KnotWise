import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import { POST as messagesPost } from "@/app/api/c2c/conversations/[id]/messages/route";
import { POST as verifyPost } from "@/app/api/client/auth/verify/route";
import { makeBiodata } from "../fixtures";
import { isDatabaseAvailable, integrationPrisma, disconnectIntegrationDb } from "./helpers/db";
import { createMutualChatFixture, deleteIntroPairFixture } from "./helpers/fixtures";
import { loginClientWithMagicLink } from "./helpers/auth";

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)("integration: c2c chat", () => {
  let fixture: Awaited<ReturnType<typeof createMutualChatFixture>>;

  beforeAll(async () => {
    fixture = await createMutualChatFixture(integrationPrisma);
  });

  afterAll(async () => {
    await deleteIntroPairFixture(integrationPrisma, fixture);
    await disconnectIntegrationDb();
  });

  it("persists a message when the participant sends", async () => {
    await loginClientWithMagicLink(integrationPrisma, fixture.clientA.clientId, verifyPost);
    const res = await messagesPost(
      new Request("http://localhost/api/c2c/conversations/x/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: "Hello from integration test" }),
      }),
      { params: Promise.resolve({ id: fixture.conversationId }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message.body).toBe("Hello from integration test");

    const stored = await integrationPrisma.c2cMessage.findFirst({
      where: { conversationId: fixture.conversationId, body: "Hello from integration test" },
    });
    expect(stored).not.toBeNull();
  });

  it("returns 404 when a non-participant sends a message", async () => {
    const id = crypto.randomBytes(4).toString("hex");
    const bio = makeBiodata({
      firstName: "Out",
      lastName: "Sider",
      email: `outsider-${id}@integration.test`,
      gender: "male",
    });

    const outsiderOrg = await integrationPrisma.organization.create({
      data: {
        name: `Outsider Org ${id}`,
        slug: `out-${id}`,
        customers: {
          create: {
            firstName: bio.firstName,
            lastName: bio.lastName,
            gender: bio.gender,
            dateOfBirth: new Date(bio.dateOfBirth),
            city: bio.city,
            country: bio.country,
            maritalStatus: bio.maritalStatus,
            biodata: JSON.stringify(bio),
            clientAccount: {
              create: {
                email: bio.email.toLowerCase(),
                emailVerifiedAt: new Date(),
                onboardingCompletedAt: new Date(),
                onboardingStep: 6,
              },
            },
          },
        },
      },
      include: { customers: { include: { clientAccount: true } } },
    });

    const outsiderClient = outsiderOrg.customers[0]?.clientAccount;
    expect(outsiderClient).toBeTruthy();

    await loginClientWithMagicLink(integrationPrisma, outsiderClient!.id, verifyPost);

    const res = await messagesPost(
      new Request("http://localhost/api/c2c/conversations/x/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: "Should not send" }),
      }),
      { params: Promise.resolve({ id: fixture.conversationId }) }
    );
    expect(res.status).toBe(404);

    await integrationPrisma.organization.delete({ where: { id: outsiderOrg.id } });
  });
});
