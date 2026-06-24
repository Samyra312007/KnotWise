import { prisma } from "@/lib/db";
import { createEmptyBiodata } from "@/lib/profile/biodata";
import { assignDefaultMatchmaker } from "@/lib/onboarding/assign";
import { buildPoolSearchText } from "@/lib/discovery/search-text";
import type { Biodata, Gender } from "@/lib/types";
import { ensureCrmLead } from "./leads";
import { escapeCsvCell, parseCsvLine } from "./csv";

export const CSV_HEADERS = [
  "firstName",
  "lastName",
  "gender",
  "dateOfBirth",
  "city",
  "country",
  "maritalStatus",
  "email",
  "phone",
  "religion",
  "caste",
  "stage",
] as const;

export async function exportCustomersCsv(orgId: string): Promise<string> {
  const customers = await prisma.customer.findMany({
    where: { orgId },
    include: { clientAccount: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const lines = [CSV_HEADERS.join(",")];
  for (const customer of customers) {
    const biodata = JSON.parse(customer.biodata) as Biodata;
    const row = [
      customer.firstName,
      customer.lastName,
      customer.gender,
      customer.dateOfBirth.toISOString().slice(0, 10),
      customer.city,
      customer.country,
      customer.maritalStatus,
      customer.clientAccount?.email ?? biodata.email ?? "",
      biodata.phone ?? "",
      biodata.religion ?? "",
      biodata.caste ?? "",
      customer.stage,
    ].map((v) => escapeCsvCell(String(v ?? "")));
    lines.push(row.join(","));
  }

  return lines.join("\n");
}

export type ImportRowResult = { ok: true; customerId: string } | { ok: false; error: string };

export async function importCustomersCsv(orgId: string, csvText: string): Promise<{
  imported: number;
  skipped: number;
  errors: Array<{ line: number; error: string }>;
}> {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return { imported: 0, skipped: 0, errors: [{ line: 1, error: "CSV must include header and at least one row." }] };
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const required = ["firstname", "lastname", "gender", "dateofbirth"];
  for (const key of required) {
    if (!header.includes(key)) {
      return { imported: 0, skipped: 0, errors: [{ line: 1, error: `Missing column: ${key}` }] };
    }
  }

  const idx = (name: string) => header.indexOf(name);

  let imported = 0;
  let skipped = 0;
  const errors: Array<{ line: number; error: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const get = (name: string) => cells[idx(name)] ?? "";

    const firstName = get("firstname");
    const lastName = get("lastname");
    const gender = get("gender") as Gender;
    const dateOfBirth = get("dateofbirth");
    const email = get("email").toLowerCase();

    if (!firstName || !lastName || !gender || !dateOfBirth) {
      errors.push({ line: i + 1, error: "Missing required fields." });
      continue;
    }

    if (gender !== "male" && gender !== "female") {
      errors.push({ line: i + 1, error: "Gender must be male or female." });
      continue;
    }

    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      errors.push({ line: i + 1, error: "Invalid dateOfBirth." });
      continue;
    }

    if (email) {
      const existing = await prisma.clientAccount.findUnique({ where: { email } });
      if (existing) {
        skipped += 1;
        continue;
      }
    }

    const biodata = createEmptyBiodata({
      email: email || `import-${Date.now()}-${i}@knotwise.local`,
      firstName,
      lastName,
      gender,
      dateOfBirth: dob.toISOString(),
    });
    biodata.city = get("city") || biodata.city;
    biodata.country = get("country") || biodata.country;
    biodata.maritalStatus = (get("maritalstatus") as Biodata["maritalStatus"]) || biodata.maritalStatus;
    biodata.phone = get("phone") || biodata.phone;
    biodata.religion = get("religion") || biodata.religion;
    biodata.caste = get("caste") || biodata.caste;

    const customer = await prisma.customer.create({
      data: {
        orgId,
        firstName,
        lastName,
        gender,
        dateOfBirth: dob,
        city: biodata.city || "—",
        country: biodata.country,
        maritalStatus: biodata.maritalStatus,
        stage: get("stage") || "Onboarding",
        biodata: JSON.stringify(biodata),
      },
    });

    await assignDefaultMatchmaker(orgId, customer.id);

    if (email) {
      await prisma.clientAccount.create({
        data: {
          customerId: customer.id,
          email,
          onboardingStep: 0,
        },
      });
    }

    await ensureCrmLead({ orgId, customerId: customer.id, source: "import" });

    const searchText = buildPoolSearchText(biodata);
    await prisma.poolProfile.create({
      data: {
        orgId,
        firstName,
        lastName,
        gender,
        dateOfBirth: dob,
        city: biodata.city || "—",
        country: biodata.country,
        biodata: JSON.stringify(biodata),
        searchText,
        linkedCustomerId: customer.id,
      },
    });

    imported += 1;
  }

  return { imported, skipped, errors };
}
