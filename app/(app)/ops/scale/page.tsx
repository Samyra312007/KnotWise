import { requireSession } from "@/lib/auth/session";
import { isOpsOrOwner } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OpsScalePanel } from "./ops-scale-panel";

export default async function OpsScalePage() {
  const session = await requireSession();
  if (!isOpsOrOwner(session.role)) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <Link href="/ops" className="text-primary underline">
          Ops home
        </Link>
        <Link href="/ops/analytics" className="text-primary underline">
          Analytics
        </Link>
      </div>
      <OpsScalePanel />
    </div>
  );
}
