import { C2cConversationList } from "@/components/portal/c2c-conversation-list";

export default function PortalChatPage() {
  return (
    <section>
      <h1 className="font-display text-display-m text-ink">Match chats</h1>
      <p className="mt-2 text-[14px] text-ink-mute">
        Private messages with mutual matches. Your matchmaker cannot read these chats.
      </p>
      <div className="mt-10">
        <C2cConversationList />
      </div>
    </section>
  );
}
