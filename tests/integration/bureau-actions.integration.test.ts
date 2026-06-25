import crypto from "crypto";
import bcrypt from "bcryptjs";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { GET as collaboratorsGet } from "@/app/api/collaborators/route";
import { POST as shortlistPost } from "@/app/api/customers/[id]/shortlist/bulk/route";
import { GET as matchesGet } from "@/app/api/customers/[id]/matches/route";
import { POST as introEmailPost } from "@/app/api/ai/intro-email/route";
import { POST as sendMatchPost } from "@/app/api/matches/send/route";
import { POST as handoffPost } from "@/app/api/customers/[id]/handoff/route";
import { makeBiodata } from "../fixtures";
import { isDatabaseAvailable, integrationPrisma, disconnectIntegrationDb } from "./helpers/db";
import { loginMatchmaker } from "./helpers/auth";

const dbReady = await isDatabaseAvailable();

function suffix() {
  return crypto.randomBytes(4).toString("hex");
}

type BureauFixture = {
  orgId: string;
  primaryMmId: string;
  colleagueMmId: string;
  primaryUsername: string;
  customerId: string;
  poolProfileIds: string[];
};

async function createBureauFixture(): Promise<BureauFixture> {
  const id = suffix();
  const clientBio = makeBiodata({
    firstName: "BureauClient",
    email: `bureau-client-${id}@integration.test`,
    gender: "male",
  });

  const org = await integrationPrisma.organization.create({
    data: { name: `Bureau Org ${id}`, slug: `bureau-${id}` },
  });

  const primary = await integrationPrisma.matchmaker.create({
    data: {
      username: `b-primary-${id}`,
      passwordHash: await bcrypt.hash("password123", 10),
      fullName: "Primary MM",
      memberships: { create: { orgId: org.id, role: "matchmaker" } },
    },
  });

  const colleague = await integrationPrisma.matchmaker.create({
    data: {
      username: `b-colleague-${id}`,
      passwordHash: await bcrypt.hash("password123", 10),
      fullName: "Colleague MM",
      memberships: { create: { orgId: org.id, role: "matchmaker" } },
    },
  });

  const customer = await integrationPrisma.customer.create({
    data: {
      orgId: org.id,
      firstName: clientBio.firstName,
      lastName: clientBio.lastName,
      gender: clientBio.gender,
      dateOfBirth: new Date(clientBio.dateOfBirth),
      city: clientBio.city,
      country: clientBio.country,
      maritalStatus: clientBio.maritalStatus,
      stage: "Active",
      biodata: JSON.stringify(clientBio),
      assignments: { create: { matchmakerId: primary.id, role: "primary" } },
      clientAccount: {
        create: {
          email: clientBio.email.toLowerCase(),
          emailVerifiedAt: new Date(),
          onboardingCompletedAt: new Date(),
          onboardingStep: 6,
        },
      },
    },
  });

  const poolProfileIds: string[] = [];
  for (let i = 0; i < 3; i++) {
    const candBio = makeBiodata({
      firstName: `Candidate${i}`,
      email: `bureau-cand-${id}-${i}@integration.test`,
      gender: "female",
      city: clientBio.city,
    });
    const pool = await integrationPrisma.poolProfile.create({
      data: {
        orgId: org.id,
        firstName: candBio.firstName,
        lastName: candBio.lastName,
        gender: candBio.gender,
        dateOfBirth: new Date(candBio.dateOfBirth),
        city: candBio.city,
        country: candBio.country,
        biodata: JSON.stringify(candBio),
        verifiedAt: new Date(),
        searchText: `candidate ${i} bureau`,
      },
    });
    poolProfileIds.push(pool.id);
  }

  return {
    orgId: org.id,
    primaryMmId: primary.id,
    colleagueMmId: colleague.id,
    primaryUsername: primary.username,
    customerId: customer.id,
    poolProfileIds,
  };
}

async function deleteBureauFixture(fixture: BureauFixture) {
  await integrationPrisma.organization.delete({ where: { id: fixture.orgId } }).catch(() => undefined);
  await integrationPrisma.matchmaker
    .deleteMany({ where: { id: { in: [fixture.primaryMmId, fixture.colleagueMmId] } } })
    .catch(() => undefined);
}

describe.skipIf(!dbReady)("bureau: shortlist, send match, handoff", () => {
  let fixture: BureauFixture;
  let savedNimKey: string | undefined;

  beforeAll(async () => {
    savedNimKey = process.env.NVIDIA_NIM_API_KEY;
    delete process.env.NVIDIA_NIM_API_KEY;
    fixture = await createBureauFixture();
  });

  afterAll(async () => {
    if (savedNimKey) process.env.NVIDIA_NIM_API_KEY = savedNimKey;
    await deleteBureauFixture(fixture);
    await disconnectIntegrationDb();
  });

  it("shortlists, drafts intro email, and sends match", async () => {
    const loginRes = await loginMatchmaker(fixture.primaryUsername, "password123", loginPost);
    expect(loginRes.status).toBe(200);

    const shortlistRes = await shortlistPost(
      new Request("http://localhost/api/shortlist/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bucket: "all", limit: 5 }),
      }),
      { params: Promise.resolve({ id: fixture.customerId }) }
    );
    expect(shortlistRes.status).toBe(200);

    const matchesRes = await matchesGet(
      new Request(
        `http://localhost/api/customers/${fixture.customerId}/matches?bucket=high&view=shortlisted`
      ),
      { params: Promise.resolve({ id: fixture.customerId }) }
    );
    expect(matchesRes.status).toBe(200);
    const matchesBody = await matchesRes.json();
    expect(matchesBody.items.length).toBeGreaterThan(0);
    expect(matchesBody.items[0].alreadySent).toBe(false);

    const candidateId = matchesBody.items[0].candidate.id;

    const draftRes = await introEmailPost(
      new Request("http://localhost/api/ai/intro-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ customerId: fixture.customerId, candidateId }),
      })
    );
    expect(draftRes.status).toBe(200);
    const draft = await draftRes.json();
    expect(draft.subject).toBeTruthy();
    expect(draft.body).toBeTruthy();

    const sendRes = await sendMatchPost(
      new Request("http://localhost/api/matches/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerId: fixture.customerId,
          candidateId,
          subject: draft.subject,
          body: draft.body,
        }),
      })
    );
    expect(sendRes.status).toBe(200);

    const suggestion = await integrationPrisma.matchSuggestion.findUnique({
      where: {
        customerId_poolProfileId: {
          customerId: fixture.customerId,
          poolProfileId: candidateId,
        },
      },
    });
    expect(suggestion?.status).toBe("sent");
  });

  it("lists colleagues excluding self and creates handoff", async () => {
    const loginRes = await loginMatchmaker(fixture.primaryUsername, "password123", loginPost);
    expect(loginRes.status).toBe(200);

    const collabRes = await collaboratorsGet();
    expect(collabRes.status).toBe(200);
    const collabBody = await collabRes.json();
    expect(collabBody.members.some((m: { matchmakerId: string }) => m.matchmakerId === fixture.primaryMmId)).toBe(
      false
    );
    expect(collabBody.members.some((m: { matchmakerId: string }) => m.matchmakerId === fixture.colleagueMmId)).toBe(
      true
    );

    const handoffRes = await handoffPost(
      new Request("http://localhost/api/handoff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          toMatchmakerId: fixture.colleagueMmId,
          note: "Please take over this client.",
        }),
      }),
      { params: Promise.resolve({ id: fixture.customerId }) }
    );
    expect(handoffRes.status).toBe(200);

    const handoff = await integrationPrisma.handoff.findFirst({
      where: {
        customerId: fixture.customerId,
        fromMatchmakerId: fixture.primaryMmId,
        toMatchmakerId: fixture.colleagueMmId,
      },
    });
    expect(handoff).toBeTruthy();
    expect(handoff?.note).toBe("Please take over this client.");
  });

  it("rejects handoff without note", async () => {
    await loginMatchmaker(fixture.primaryUsername, "password123", loginPost);

    const res = await handoffPost(
      new Request("http://localhost/api/handoff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toMatchmakerId: fixture.colleagueMmId, note: "" }),
      }),
      { params: Promise.resolve({ id: fixture.customerId }) }
    );
    expect(res.status).toBe(400);
  });
});
