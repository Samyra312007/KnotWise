export function OnboardingProgress({
  step,
  stepCount,
  completeness,
  minCompleteness,
}: {
  step: number;
  stepCount: number;
  completeness: number;
  minCompleteness: number;
}) {
  const stepPct = ((step + 1) / stepCount) * 100;
  const completePct = Math.min(100, completeness);

  return (
    <div className="mt-6 space-y-3">
      <div className="h-1 w-full bg-paper-deep overflow-hidden">
        <div
          className="h-full bg-marigold transition-all duration-300"
          style={{ width: `${stepPct}%` }}
        />
      </div>
      <div className="h-1 w-full bg-paper-deep overflow-hidden">
        <div
          className="h-full bg-indigo transition-all duration-300"
          style={{ width: `${completePct}%` }}
        />
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
        Profile {completeness}% · {completeness >= minCompleteness ? "Ready to submit" : `${minCompleteness}% needed`}
      </p>
    </div>
  );
}
