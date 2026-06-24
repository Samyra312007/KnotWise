import { DiscoveryFeedPanel } from "@/components/portal/discovery-feed";

export default function PortalDiscoverPage() {
  return (
    <section>
      <h1 className="font-display text-display-m text-ink">Discover</h1>
      <p className="mt-2 text-[14px] text-ink-mute">
        Browse verified candidates in your bureau pool. Expressing interest notifies your matchmaker — it does not open
        chat directly.
      </p>
      <div className="mt-10">
        <DiscoveryFeedPanel />
      </div>
    </section>
  );
}
