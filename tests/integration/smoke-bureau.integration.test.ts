import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { GET as customersGet } from "@/app/api/customers/route";
import { GET as healthGet } from "@/app/api/health/route";
import { isDatabaseAvailable, integrationPrisma, disconnectIntegrationDb } from "./helpers/db";
import { createIntroPairFixture, deleteIntroPairFixture } from "./helpers/fixtures";
import { loginMatchmaker } from "./helpers/auth";

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)("smoke: matchmaker bureau", () => {
  let fixture: Awaited<ReturnType<typeof createIntroPairFixture>>;
  let username: string;

  beforeAll(async () => {
    fixture = await createIntroPairFixture(integrationPrisma);
    const mm = await integrationPrisma.matchmaker.findUnique({ where: { id: fixture.matchmakerId } });
    username = mm!.username;
  });

  afterAll(async () => {
    await deleteIntroPairFixture(integrationPrisma, fixture);
    await disconnectIntegrationDb();
  });

  it("health endpoint reports ok", async () => {
    const res = await healthGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("matchmaker login and customer list", async () => {
    const loginRes = await loginMatchmaker(username, "password123", loginPost);
    expect(loginRes.status).toBe(200);

    const listRes = await customersGet(new Request("http://localhost/api/customers"));
    expect(listRes.status).toBe(200);
    const body = await listRes.json();
    expect(body.items.length).toBeGreaterThan(0);
  });
});
