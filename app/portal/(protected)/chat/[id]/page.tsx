import { C2cChatPanel } from "@/components/portal/c2c-chat-panel";
import { SchedulePanelLoader } from "@/components/portal/schedule-panel-loader";

export default async function PortalChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <section>
      <C2cChatPanel conversationId={id} />
      <SchedulePanelLoader conversationId={id} />
    </section>
  );
}
