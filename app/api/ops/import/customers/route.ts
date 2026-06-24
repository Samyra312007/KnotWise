import { NextResponse } from "next/server";
import { requireApiOps } from "@/lib/auth/api";
import { importCustomersCsv } from "@/lib/crm/import-export";

export async function POST(req: Request) {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;

  const contentType = req.headers.get("content-type") ?? "";
  let csvText: string;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Upload a CSV file." } }, { status: 400 });
    }
    csvText = await file.text();
  } else {
    const body = (await req.json()) as { csv?: string };
    if (!body.csv?.trim()) {
      return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Provide csv text." } }, { status: 400 });
    }
    csvText = body.csv;
  }

  const result = await importCustomersCsv(session.orgId, csvText);
  return NextResponse.json({ ok: true, ...result });
}
