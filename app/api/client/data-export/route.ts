import { NextResponse } from "next/server";
import { requireApiClientSession } from "@/lib/auth/api";
import { requestCustomerDataExport } from "@/lib/compliance/export";

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  try {
    const result = await requestCustomerDataExport(session.customerId, session.clientId);
    return NextResponse.json({
      ok: true,
      requestId: result.requestId,
      expiresAt: result.expiresAt,
      bundle: result.bundle,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
    }
    throw err;
  }
}
