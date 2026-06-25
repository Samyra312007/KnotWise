import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function portraitUrl(ageYears: number): string {
  let h = 0;
  const seed = `Diya-Sinha-${ageYears}`;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const n = h % 100;
  return `https://randomuser.me/api/portraits/women/${n}.jpg`;
}

async function main() {
  const customers = await prisma.customer.findMany({
    where: { firstName: "Diya", lastName: "Sinha" },
  });

  if (customers.length === 0) {
    console.log("No Diya Sinha customer found. Run npm run db:seed first.");
    return;
  }

  for (const customer of customers) {
    const biodata = JSON.parse(customer.biodata) as Record<string, unknown>;
    const ageYears = Math.floor(
      (Date.now() - new Date(customer.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    const photoUrl = portraitUrl(ageYears);
    biodata.photoUrl = photoUrl;

    await prisma.customer.update({
      where: { id: customer.id },
      data: { photoUrl, biodata: JSON.stringify(biodata) },
    });

    await prisma.poolProfile.updateMany({
      where: { linkedCustomerId: customer.id },
      data: { photoUrl, biodata: JSON.stringify({ ...biodata, photoUrl }) },
    });

    console.log(`Restored photo for Diya Sinha (${customer.id}): ${photoUrl}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
