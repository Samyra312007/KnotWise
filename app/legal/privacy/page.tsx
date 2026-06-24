import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/portal/signup" className="font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion">
          ← Back
        </Link>
        <h1 className="mt-8 font-display text-display-m">Privacy Policy</h1>
        <p className="mt-2 text-[13px] text-ink-mute">DPDP Act 2023 aligned · Last updated: June 2026</p>

        <article className="mt-10 space-y-6 text-[15px] text-ink-warm leading-relaxed">
          <section>
            <h2 className="font-display-tight text-[20px] text-ink">Data we collect</h2>
            <p className="mt-2">
              Profile biodata, photos, verification documents, messages with your matchmaker and mutual matches, payment
              metadata, device tokens for notifications, and optional birth details for Kundli matching when you consent.
            </p>
          </section>
          <section>
            <h2 className="font-display-tight text-[20px] text-ink">How we use data</h2>
            <p className="mt-2">
              Purposes include matchmaking, identity verification, billing, scheduling, and service notifications. Your
              bureau organisation is the data fiduciary for client profiles; KnotWise processes data on their
              instructions. Kundli data is sent to astrology partners only with separate explicit consent.
            </p>
          </section>
          <section>
            <h2 className="font-display-tight text-[20px] text-ink">Sharing</h2>
            <p className="mt-2">
              Matchmakers see your full profile. Other clients see limited profiles until mutual match; phone and email
              are shared only after you opt in post-mutual. Family delegates see intros per their role. We use service
              providers for email, payments, video calls, and hosting under contractual safeguards.
            </p>
          </section>
          <section>
            <h2 className="font-display-tight text-[20px] text-ink">Retention</h2>
            <p className="mt-2">
              Active account data is retained while your profile is open. Closed accounts are anonymized after deletion.
              Messages may be retained up to one year after a match closes for dispute resolution. Audit logs may be
              kept longer for legal compliance.
            </p>
          </section>
          <section>
            <h2 className="font-display-tight text-[20px] text-ink">Your rights</h2>
            <p className="mt-2">
              You may export your data or request account deletion from Privacy settings in the client portal. Marketing
              emails require separate opt-in. Session cookies are essential; product analytics are optional where
              enabled.
            </p>
          </section>
          <section>
            <h2 className="font-display-tight text-[20px] text-ink">Family delegates</h2>
            <p className="mt-2">
              If you invite a parent or guardian as a delegate, they can view intros per the permissions you grant.
              Delegate access is disclosed here and can be revoked anytime from Family settings.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
