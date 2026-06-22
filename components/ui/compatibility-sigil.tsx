"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CompatibilitySigilProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showBucket?: boolean;
  className?: string;
  animate?: boolean;
}

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const largeArcFlag = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

const SIZES: Record<NonNullable<CompatibilitySigilProps["size"]>, { px: number; numberPx: number; metaPx: number; sw: number }> = {
  sm: { px: 36, numberPx: 12, metaPx: 9, sw: 1.6 },
  md: { px: 64, numberPx: 18, metaPx: 10, sw: 2 },
  lg: { px: 96, numberPx: 28, metaPx: 11, sw: 2.4 },
};

export function bucketOf(score: number): "high" | "medium" | "low" {
  if (score >= 75) return "high";
  if (score >= 55) return "medium";
  return "low";
}

const BUCKET_LABEL: Record<ReturnType<typeof bucketOf>, string> = {
  high: "HIGH POTENTIAL",
  medium: "WORTH CONSIDERING",
  low: "LOW FIT",
};

const BUCKET_COLOR: Record<ReturnType<typeof bucketOf>, string> = {
  high: "text-marigold",
  medium: "text-indigo/80",
  low: "text-ink-mute",
};

export function CompatibilitySigil({
  score,
  size = "lg",
  showBucket = true,
  className,
  animate = true,
}: CompatibilitySigilProps) {
  const cfg = SIZES[size];
  const clamped = Math.max(0, Math.min(100, score));
  const sweep = 60 + (clamped / 100) * 240;
  const startDeg = -150;
  const endDeg = startDeg + sweep;

  const cx = 60;
  const cy = 60;
  const rOuter = 44;
  const rInner = 38;

  const arcA = arcPath(cx, cy, rOuter, startDeg, endDeg);
  const arcB = arcPath(cx, cy, rInner, startDeg, endDeg);

  const bucket = bucketOf(clamped);
  const [display, setDisplay] = React.useState(animate ? 0 : clamped);

  React.useEffect(() => {
    if (!animate) return setDisplay(clamped);
    const start = performance.now();
    const dur = 360;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setDisplay(Math.round(p * clamped));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clamped, animate]);

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: cfg.px, height: cfg.px }}>
        <svg
          viewBox="0 0 120 120"
          width={cfg.px}
          height={cfg.px}
          className="overflow-visible"
        >
          <path
            d={arcPath(cx, cy, rOuter, -150, 90)}
            stroke="currentColor"
            className="text-ink/8"
            strokeWidth={cfg.sw * 0.8}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={arcPath(cx, cy, rInner, -150, 90)}
            stroke="currentColor"
            className="text-ink/8"
            strokeWidth={cfg.sw * 0.8}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={arcA}
            stroke="currentColor"
            className="text-indigo"
            strokeWidth={cfg.sw}
            fill="none"
            strokeLinecap="round"
            pathLength={1}
            style={
              animate
                ? {
                    strokeDasharray: 1,
                    strokeDashoffset: 1,
                    animation: `reveal-arc var(--duration-standard) var(--ease-out-expo) forwards`,
                  }
                : undefined
            }
          />
          <path
            d={arcB}
            stroke="currentColor"
            className="text-marigold"
            strokeWidth={cfg.sw}
            fill="none"
            strokeLinecap="round"
            pathLength={1}
            style={
              animate
                ? {
                    strokeDasharray: 1,
                    strokeDashoffset: 1,
                    animation: `reveal-arc var(--duration-standard) var(--ease-out-expo) 60ms forwards`,
                  }
                : undefined
            }
          />
          <style>{`@keyframes reveal-arc { to { stroke-dashoffset: 0; } }`}</style>
        </svg>
        {size !== "sm" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div
              className="font-mono font-medium text-ink leading-none"
              style={{ fontSize: cfg.numberPx, fontVariantNumeric: "tabular-nums" }}
            >
              {display}
            </div>
            <div
              className="font-mono font-medium uppercase text-ink-mute mt-1"
              style={{ fontSize: cfg.metaPx, letterSpacing: "0.18em" }}
            >
              OF 100
            </div>
          </div>
        )}
      </div>
      {showBucket && size !== "sm" && (
        <>
          <div className="h-px w-12 bg-ink/12" />
          <div
            className={cn(
              "font-mono font-medium uppercase",
              BUCKET_COLOR[bucket]
            )}
            style={{ fontSize: 10, letterSpacing: "0.18em" }}
          >
            {BUCKET_LABEL[bucket]}
          </div>
        </>
      )}
    </div>
  );
}
