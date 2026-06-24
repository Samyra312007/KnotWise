import { requireSession } from "@/lib/auth/session";
import { isOpsOrOwner } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { AnalyticsCrmPanel } from "@/components/ops/analytics-crm-panel";

export default async function OpsAnalyticsPage() {
  const session = await requireSession();
  if (!isOpsOrOwner(session.role)) redirect("/dashboard");
  return <AnalyticsCrmPanel />;
}
