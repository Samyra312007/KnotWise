import { C2cChatPanel } from "@/components/portal/c2c-chat-panel";

export default async function PortalChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <section>
      <C2cChatPanel conversationId={id} />
    </section>
  );
}
