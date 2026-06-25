import crypto from "crypto";
import type { PrismaClient } from "@prisma/client";
import { hashToken } from "@/lib/auth/token-hash";
import { resetIntegrationCookies } from "../setup";

export async function loginClientWithMagicLink(
  prisma: PrismaClient,
  clientId: string,
  verifyPost: (req: Request) => Promise<Response>
) {
  resetIntegrationCookies();
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.magicLinkToken.create({
    data: {
      clientId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const res = await verifyPost(
    new Request("http://localhost/api/client/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
  );

  return { res, token };
}

export async function loginMatchmaker(
  username: string,
  password: string,
  loginPost: (req: Request) => Promise<Response>
) {
  resetIntegrationCookies();
  return loginPost(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
  );
}
