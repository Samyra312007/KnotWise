import { requireSession } from "@/lib/auth/session";
import { isOpsOrOwner } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { OpsDashboard } from "./ops-dashboard";

export default async function OpsPage() {
  const session = await requireSession();
  if (!isOpsOrOwner(session.role)) redirect("/dashboard");
  return <OpsDashboard role={session.role} />;
}
