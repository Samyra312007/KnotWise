import { NotificationPreferencesPanel } from "@/components/portal/notification-preferences-panel";

export default function PortalNotificationsPage() {
  return (
    <section>
      <h1 className="font-display text-display-m text-ink">Notifications</h1>
      <p className="mt-2 text-[14px] text-ink-mute">
        Choose which events send push notifications to your phone.
      </p>
      <div className="mt-10">
        <NotificationPreferencesPanel />
      </div>
    </section>
  );
}
