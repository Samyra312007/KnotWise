import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/portal/signup" className="font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion">
          ← Back
        </Link>
        <h1 className="mt-8 font-display text-display-m">Terms of Service</h1>
        <p className="mt-2 text-[13px] text-ink-mute">Last updated: June 2026 · India jurisdiction</p>

        <article className="mt-10 space-y-6 text-[15px] text-ink-warm leading-relaxed">
          <section>
            <h2 className="font-display-tight text-[20px] text-ink">Eligibility</h2>
            <p className="mt-2">
              KnotWise is a matrimonial matchmaking platform. You must be at least 18 years old, legally able to marry
              under applicable law, and joining with genuine matrimonial intent. Bureau matchmakers mediate introductions;
              KnotWise does not guarantee marriage or compatibility outcomes.
            </p>
          </section>
          <section>
            <h2 className="font-display-tight text-[20px] text-ink">Your responsibilities</h2>
            <p className="mt-2">
              You agree to provide accurate profile information, treat other members respectfully, and not use the
              platform for harassment, commercial solicitation, or fraudulent profiles. Contact details are shared only
              after a mutual match and your explicit consent.
            </p>
          </section>
          <section>
            <h2 className="font-display-tight text-[20px] text-ink">Account termination</h2>
            <p className="mt-2">
              Your bureau or KnotWise may suspend or terminate accounts that violate these terms. You may request account
              deletion at any time from Privacy settings; deletion completes after a 30-day grace period.
            </p>
          </section>
          <section>
            <h2 className="font-display-tight text-[20px] text-ink">Disputes</h2>
            <p className="mt-2">
              These terms are governed by the laws of India. Courts in Bengaluru, Karnataka shall have exclusive
              jurisdiction, subject to mandatory consumer protection laws.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
