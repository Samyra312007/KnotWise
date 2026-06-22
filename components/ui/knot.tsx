import { cn } from "@/lib/utils";

const KNOT_PATH =
  "M 60 18 C 25 18, 25 58, 60 58 C 95 58, 95 102, 60 102 C 25 102, 25 62, 60 62 C 95 62, 95 22, 60 22 Z";

export const KNOT_LENGTH = 760;

export interface KnotProps {
  size?: number;
  animate?: boolean;
  className?: string;
  strokeWidth?: number;
  delayMs?: number;
}

export function Knot({
  size = 32,
  animate = false,
  className,
  strokeWidth,
  delayMs = 0,
}: KnotProps) {
  const sw =
    strokeWidth ??
    (size <= 24 ? 1.6 : size <= 64 ? 1.8 : size <= 120 ? 2 : 2.4);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={cn("inline-block shrink-0 align-middle", className)}
    >
      <defs>
        <mask id={`knot-mask-${size}-${animate ? "a" : "s"}`}>
          <rect width="120" height="120" fill="white" />
          <circle cx="60" cy="60" r="3" fill="black" />
        </mask>
      </defs>
      <path
        d={KNOT_PATH}
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={KNOT_LENGTH}
        mask={`url(#knot-mask-${size}-${animate ? "a" : "s"})`}
        style={
          animate
            ? {
                strokeDasharray: KNOT_LENGTH,
                strokeDashoffset: KNOT_LENGTH,
                animation: `knot-draw var(--duration-signature) var(--ease-in-out-quint) ${delayMs}ms forwards`,
              }
            : undefined
        }
      />
    </svg>
  );
}
