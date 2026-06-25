import type { RiskLevel } from "@/lib/permissions";
import { riskColorVar } from "./risk-badge";

/** Circular gauge showing the risk score and verdict. */
export function ScoreMeter({
  score,
  verdict,
}: {
  score: number;
  verdict: RiskLevel;
}) {
  const max = 120;
  const pct = Math.min(score / max, 1);
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const color = riskColorVar(verdict);

  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="12"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">risk score</span>
        <span
          className="mt-1 text-sm font-semibold uppercase tracking-wide"
          style={{ color }}
        >
          {verdict}
        </span>
      </div>
    </div>
  );
}