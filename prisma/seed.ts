import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";
import type {
  Biodata,
  Diet,
  EducationLevel,
  Frequency,
  Gender,
  MaritalStatus,
  Stage,
  Trinary,
} from "../lib/types";
import {
  CITIES_WEIGHTED,
  COLLEGES,
  COMPANIES,
  DEGREES_BY_LEVEL,
  DESIGNATIONS,
  FIRST_NAMES_FEMALE,
  FIRST_NAMES_MALE,
  MOTHER_TONGUES,
  OCCUPATIONS_PARENT,
  RELIGIONS_WEIGHTED,
  SURNAMES,
} from "./seed-data";

const prisma = new PrismaClient();
faker.seed(42);

function weightedPick<T>(items: Array<{ weight: number } & T>): T {
  const total = items.reduce((s, it) => s + it.weight, 0);
  let n = faker.number.float({ min: 0, max: total });
  for (const it of items) {
    n -= it.weight;
    if (n <= 0) return it;
  }
  return items[0];
}

function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(faker.number.float({ min: 0, max: arr.length - 0.001 }))];
}

function pickSome<T>(arr: readonly T[], min: number, max: number): T[] {
  const count = faker.number.int({ min, max });
  const set = new Set<T>();
  while (set.size < count && set.size < arr.length) {
    set.add(pickOne(arr));
  }
  return Array.from(set);
}

function trinary(weights: [number, number, number] = [60, 20, 20]): Trinary {
  const total = weights[0] + weights[1] + weights[2];
  const r = faker.number.float({ min: 0, max: total });
  if (r < weights[0]) return "Yes";
  if (r < weights[0] + weights[1]) return "No";
  return "Maybe";
}

function logNormalIncome(): number {
  const base = Math.exp(faker.number.float({ min: 12.2, max: 15.4 }));
  return Math.round(base / 10000) * 10000;
}

function generateBiodata(gender: Gender, opts: { ageMin?: number; ageMax?: number; heightMinCm?: number; heightMaxCm?: number } = {}): Biodata {
  const firstName = pickOne(gender === "male" ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE);
  const lastName = pickOne(SURNAMES);

  const ageMin = opts.ageMin ?? 24;
  const ageMax = opts.ageMax ?? 38;
  const ageYears = faker.number.int({ min: ageMin, max: ageMax });
  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - ageYears);
  dob.setMonth(faker.number.int({ min: 0, max: 11 }));
  dob.setDate(faker.number.int({ min: 1, max: 28 }));

  const cityRow = weightedPick(CITIES_WEIGHTED);
  const religionRow = weightedPick(RELIGIONS_WEIGHTED);
  const caste = pickOne(religionRow.castes);

  const motherTongue =
    faker.number.float({ min: 0, max: 1 }) < 0.65
      ? cityRow.tongue
      : pickOne(MOTHER_TONGUES);

  const heightMinCm = opts.heightMinCm ?? (gender === "male" ? 165 : 150);
  const heightMaxCm = opts.heightMaxCm ?? (gender === "male" ? 188 : 175);
  const heightCm = faker.number.int({ min: heightMinCm, max: heightMaxCm });

  const educationLevel = pickOne<EducationLevel>([
    "Bachelor's",
    "Bachelor's",
    "Master's",
    "Master's",
    "Master's",
    "PhD",
    "Professional",
  ]);
  const degree = pickOne(DEGREES_BY_LEVEL[educationLevel] ?? DEGREES_BY_LEVEL["Bachelor's"]);

  const diet = pickOne<Diet>([
    "Vegetarian",
    "Vegetarian",
    "Vegetarian",
    "Non-vegetarian",
    "Non-vegetarian",
    "Eggetarian",
    "Jain",
    "Vegan",
  ]);

  const wantKids = trinary([65, 15, 20]);
  const openToRelocate = trinary([45, 25, 30]);
  const openToPets = trinary([40, 35, 25]);

  const smoking = pickOne<Frequency>(["Never", "Never", "Never", "Occasionally"]);
  const drinking = pickOne<Frequency>(["Never", "Never", "Occasionally", "Socially" as Frequency, "Occasionally"]);
  const maritalStatus = pickOne<MaritalStatus>([
    "Never Married",
    "Never Married",
    "Never Married",
    "Never Married",
    "Never Married",
    "Divorced",
  ]);

  const annualIncomeINR = logNormalIncome();

  const partnerAgeMin = gender === "male" ? Math.max(22, ageYears - 6) : Math.max(22, ageYears - 2);
  const partnerAgeMax = gender === "male" ? ageYears + 1 : ageYears + 6;
  const partnerHeightMin = gender === "male" ? 150 : 165;
  const partnerHeightMax = gender === "male" ? heightCm - 2 : 195;

  const bio = faker.helpers.arrayElement([
    `Quietly ambitious, family-oriented, and learning ${pickOne(["Hindustani vocals", "tennis", "Italian", "pottery", "Spanish", "watercolour"])} on the weekends.`,
    `Grew up in ${cityRow.city}. Travels often. Reads a lot of nonfiction. Looking for a partner who is kind first, everything else second.`,
    `Builds ${pickOne(["software", "businesses", "art", "homes"])} during the day; cooks elaborate weekend dinners. Wants a peaceful, equal partnership.`,
    `${pickOne(["Marathon runner", "Long-distance cyclist", "Chess player", "Trekker"])}. Close with parents. Looking forward to building a thoughtful life with someone curious.`,
  ]);

  const phone = `+91 ${faker.string.numeric(5)} ${faker.string.numeric(5)}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${faker.number.int({ min: 1, max: 99 })}@${pickOne(["gmail.com", "outlook.com", "yahoo.in", "protonmail.com"])}`;

  return {
    firstName,
    lastName,
    gender,
    dateOfBirth: dob.toISOString(),
    heightCm,
    motherTongue,
    maritalStatus,

    country: "India",
    city: cityRow.city,
    openToRelocate,

    email,
    phone,

    educationLevel,
    undergradCollege: pickOne(COLLEGES),
    degree,
    currentCompany: pickOne(COMPANIES),
    designation: pickOne(DESIGNATIONS),
    annualIncomeINR,

    fathersOccupation: pickOne(OCCUPATIONS_PARENT),
    mothersOccupation: pickOne([...OCCUPATIONS_PARENT, "Homemaker", "Homemaker"]),
    siblings: faker.number.int({ min: 0, max: 3 }),
    familyType: pickOne(["Nuclear", "Joint"] as const),

    religion: religionRow.name,
    caste,
    subCaste: faker.number.float({ min: 0, max: 1 }) > 0.5 ? caste : undefined,
    gotra: religionRow.name === "Hindu" && faker.number.float({ min: 0, max: 1 }) > 0.6 ? pickOne(["Bharadwaja", "Kashyapa", "Vasishtha", "Atri", "Gautama", "Vishvamitra"]) : undefined,
    manglik: pickOne(["No", "No", "No", "Yes", "Don't know", "Doesn't matter"] as const),

    diet,
    smoking,
    drinking: drinking === ("Socially" as Frequency) ? "Occasionally" : drinking,
    wantKids,
    openToPets,
    languagesKnown: Array.from(new Set([motherTongue, "English", ...pickSome(MOTHER_TONGUES, 0, 2)])),

    bio,

    partnerPreferences: {
      ageMin: partnerAgeMin,
      ageMax: partnerAgeMax,
      heightMinCm: partnerHeightMin,
      heightMaxCm: partnerHeightMax,
      religions: faker.number.float({ min: 0, max: 1 }) > 0.4 ? [religionRow.name] : [],
      motherTongues: faker.number.float({ min: 0, max: 1 }) > 0.7 ? [motherTongue] : [],
      cities: openToRelocate === "No" ? [cityRow.city] : [],
      educationMin: pickOne<EducationLevel>(["Bachelor's", "Bachelor's", "Master's"]),
      acceptsManglik: pickOne(["Doesn't matter", "Doesn't matter", "No"] as const),
      acceptedMaritalStatuses: ["Never Married"] as MaritalStatus[],
      openToOtherReligions: faker.number.float({ min: 0, max: 1 }) > 0.6,
      preferredDiets: diet === "Vegetarian" || diet === "Jain" ? ["Vegetarian", "Eggetarian", "Vegan", "Jain"] : undefined,
    },

    photoUrl: `https://i.pravatar.cc/240?u=${firstName}-${lastName}-${ageYears}`,
  };
}

const MATCHMAKERS = [
  { username: "riya", fullName: "Riya Kapoor", role: "matchmaker" as const },
  { username: "arjun", fullName: "Arjun Mehta", role: "matchmaker" as const },
  { username: "ops", fullName: "Ops Desk", role: "ops" as const },
];

const STAGES_FOR_CUSTOMERS: Stage[] = [
  "Onboarding",
  "Active",
  "Active",
  "Active",
  "Active",
  "Match Sent",
  "In Conversation",
  "Paused",
];

async function main() {
  console.log("Resetting database...");
  await prisma.mobileAuthToken.deleteMany();
  await prisma.profileChangeRequest.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.modelVersion.deleteMany();
  await prisma.orgMatchingConfig.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.verificationDocument.deleteMany();
  await prisma.verificationCase.deleteMany();
  await prisma.threadParticipant.deleteMany();
  await prisma.threadMessage.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.handoff.deleteMany();
  await prisma.magicLinkToken.deleteMany();
  await prisma.clientAccount.deleteMany();
  await prisma.clientBilling.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.matchSuggestion.deleteMany();
  await prisma.note.deleteMany();
  await prisma.customerCollaborator.deleteMany();
  await prisma.customerAssignment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.poolProfile.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.matchmaker.deleteMany();
  await prisma.organization.deleteMany();

  console.log("Seeding organization...");
  const org = await prisma.organization.create({
    data: { name: "TDC Matchmaker Bureau", slug: "tdc" },
  });

  console.log("Seeding matchmakers...");
  const passwordHash = await bcrypt.hash("password123", 10);
  const matchmakers = await Promise.all(
    MATCHMAKERS.map((m) =>
      prisma.matchmaker.create({
        data: { username: m.username, fullName: m.fullName, passwordHash },
      })
    )
  );

  for (let i = 0; i < matchmakers.length; i++) {
    await prisma.membership.create({
      data: {
        orgId: org.id,
        matchmakerId: matchmakers[i].id,
        role: MATCHMAKERS[i].role,
      },
    });
  }

  await prisma.subscription.create({
    data: {
      orgId: org.id,
      stripeSubscriptionId: `seed_sub_${org.id}`,
      stripePriceId: "seed_price",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      seatCount: 10,
    },
  });

  console.log("Generating 120 pool profiles (60 male / 60 female)...");
  const poolBiodata: Biodata[] = [];
  for (let i = 0; i < 60; i++) poolBiodata.push(generateBiodata("male"));
  for (let i = 0; i < 60; i++) poolBiodata.push(generateBiodata("female"));

  for (const b of poolBiodata) {
    await prisma.poolProfile.create({
      data: {
        orgId: org.id,
        firstName: b.firstName,
        lastName: b.lastName,
        gender: b.gender,
        dateOfBirth: new Date(b.dateOfBirth),
        city: b.city,
        country: b.country,
        biodata: JSON.stringify(b),
        photoUrl: b.photoUrl ?? null,
        verifiedAt: new Date(),
      },
    });
  }

  console.log("Generating customers (8 per matchmaker)...");
  const mmRoles = [
    { mm: matchmakers[0], role: "matchmaker" },
    { mm: matchmakers[1], role: "matchmaker" },
    { mm: matchmakers[2], role: "ops" },
  ] as const;

  for (const { mm } of mmRoles) {
    for (let i = 0; i < 8; i++) {
      const gender: Gender = i % 2 === 0 ? "female" : "male";
      const b = generateBiodata(gender);
      const stage = STAGES_FOR_CUSTOMERS[i];
      const customer = await prisma.customer.create({
        data: {
          orgId: org.id,
          firstName: b.firstName,
          lastName: b.lastName,
          gender: b.gender,
          dateOfBirth: new Date(b.dateOfBirth),
          city: b.city,
          country: b.country,
          maritalStatus: b.maritalStatus,
          stage,
          biodata: JSON.stringify(b),
          photoUrl: b.photoUrl ?? null,
          verifiedAt: stage === "Onboarding" ? null : new Date(),
        },
      });
      await prisma.customerAssignment.create({
        data: { customerId: customer.id, matchmakerId: mm.id, role: "primary" },
      });
      if (mm.username === "riya" && i === 0) {
        await prisma.clientAccount.create({
          data: {
            customerId: customer.id,
            email: b.email.toLowerCase(),
            emailVerifiedAt: new Date(),
          },
        });
      }
    }
  }

  console.log("Writing data/dummy-profiles.json...");
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    path.join(dataDir, "dummy-profiles.json"),
    JSON.stringify(poolBiodata, null, 2)
  );

  const counts = {
    organizations: await prisma.organization.count(),
    matchmakers: await prisma.matchmaker.count(),
    customers: await prisma.customer.count(),
    poolProfiles: await prisma.poolProfile.count(),
  };
  console.log("Done.", counts);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
