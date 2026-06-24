import { NextResponse } from "next/server";
import { requireApiClientSession } from "@/lib/auth/api";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const invoices = await prisma.clientBillingInvoice.findMany({
    where: { customerId: session.customerId },
    orderBy: { issuedAt: "desc" },
    take: 24,
  });

  return NextResponse.json({
    items: invoices.map((inv) => ({
      id: inv.id,
      amountInr: inv.amountInr,
      gstInr: inv.gstInr,
      status: inv.status,
      invoiceUrl: inv.invoiceUrl,
      issuedAt: inv.issuedAt.toISOString(),
    })),
  });
}
