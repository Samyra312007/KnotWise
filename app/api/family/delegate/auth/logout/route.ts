import { NextResponse } from "next/server";
import { clearDelegateSession } from "@/lib/auth/delegate-session";

export async function POST(req: Request) {
  await clearDelegateSession();
  return NextResponse.redirect(new URL("/portal/delegate/login", req.url));
}
