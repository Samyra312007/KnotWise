import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const payload = await req.json();
  const type = payload.type as string;
  const data = payload.data as { email_id?: string; created_at?: string };

  if ((type === "email.delivered" || type === "email.sent") && data.email_id) {
    await prisma.emailLog.updateMany({
      where: { providerId: data.email_id },
      data: {
        deliveryStatus: type === "email.delivered" ? "delivered" : "sent",
        deliveredAt: new Date(),
      },
    });
  }

  if (type === "email.bounced" && data.email_id) {
    await prisma.emailLog.updateMany({
      where: { providerId: data.email_id },
      data: { deliveryStatus: "bounced", errorMessage: "Bounced" },
    });
  }

  return NextResponse.json({ ok: true });
}
