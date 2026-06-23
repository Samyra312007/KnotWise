import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  const session = await getClientSession();
  session.destroy();
  return NextResponse.redirect(new URL("/portal/login", req.url));
}
