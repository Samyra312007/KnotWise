import { NextResponse } from "next/server";
import { buildOpenApiSpec } from "@/lib/scale/openapi";

export async function GET() {
  return NextResponse.json(buildOpenApiSpec());
}
