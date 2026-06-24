import { NextResponse } from "next/server";
import { requireApiOps } from "@/lib/auth/api";
import { exportCustomersCsv } from "@/lib/crm/import-export";

export async function GET() {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;

  const csv = await exportCustomersCsv(session.orgId);
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="knotwise-customers.csv"',
    },
  });
}
