import FamilyDelegatesPanel from "@/components/portal/family-delegates-panel";

export default function PortalFamilyPage() {
  return (
    <section>
      <h1 className="font-display text-display-m text-ink">Family</h1>
      <p className="mt-2 text-[14px] text-ink-mute max-w-xl">
        Manage who can view your journey and respond to intros on your behalf.
      </p>
      <FamilyDelegatesPanel />
    </section>
  );
}
