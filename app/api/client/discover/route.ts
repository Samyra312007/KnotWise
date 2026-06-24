import { NextResponse } from "next/server";
import { requireApiClientSession } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { getDiscoveryFeed } from "@/lib/discovery/feed";
import { PROFILE_CITIES, RELIGIONS } from "@/lib/profile/options";
import { observeResponse } from "@/lib/scale/observe";

export async function GET(req: Request) {
  const started = Date.now();
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return observeResponse("/api/client/discover", started, session);

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { orgId: true },
  });
  if (!customer) {
    return observeResponse(
      "/api/client/discover",
      started,
      NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 })
    );
  }

  const url = new URL(req.url);
  const city = url.searchParams.get("city") ?? undefined;
  const religion = url.searchParams.get("religion") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const ageMinRaw = url.searchParams.get("ageMin");
  const ageMaxRaw = url.searchParams.get("ageMax");
  const limitRaw = url.searchParams.get("limit");

  const ageMin = ageMinRaw ? Number(ageMinRaw) : undefined;
  const ageMax = ageMaxRaw ? Number(ageMaxRaw) : undefined;
  const limit = limitRaw ? Number(limitRaw) : undefined;

  try {
    const feed = await getDiscoveryFeed({
      customerId: session.customerId,
      orgId: customer.orgId,
      filters: {
        city,
        religion,
        q,
        ageMin: Number.isFinite(ageMin) ? ageMin : undefined,
        ageMax: Number.isFinite(ageMax) ? ageMax : undefined,
      },
      cursor,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    return observeResponse(
      "/api/client/discover",
      started,
      NextResponse.json({
        ...feed,
        filters: {
          cities: PROFILE_CITIES,
          religions: RELIGIONS,
        },
      })
    );
  } catch (err) {
    if (err instanceof Error && err.message === "DISABLED") {
      return observeResponse(
        "/api/client/discover",
        started,
        NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Discovery is not enabled for your bureau." } },
          { status: 403 }
        )
      );
    }
    if (err instanceof Error && err.message === "PREMIUM_REQUIRED") {
      return observeResponse(
        "/api/client/discover",
        started,
        NextResponse.json(
          { error: { code: "PREMIUM_REQUIRED", message: "Discovery requires a Premium plan." } },
          { status: 403 }
        )
      );
    }
    throw err;
  }
}
