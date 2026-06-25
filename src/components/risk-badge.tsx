import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/permissions";

const STYLES: Record<RiskLevel, { varName: string }> = {
  Low: { varName: "--risk-low" },
  Moderate: { varName: "--risk-moderate" },
  High: { varName: "--risk-high" },
  Critical: { varName: "--risk-critical" },
};

export function RiskBadge({
  level,
  className,
  size = "sm",
}: {
  level: RiskLevel;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const color = `var(${STYLES[level].varName})`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wide",
        size === "sm" && "px-2.5 py-0.5 text-[11px]",
        size === "md" && "px-3 py-1 text-xs",
        size === "lg" && "px-4 py-1.5 text-sm",
        className,
      )}
      style={{
        color,
        borderColor: `color-mix(in oklch, ${color} 50%, transparent)`,
        backgroundColor: `color-mix(in oklch, ${color} 14%, transparent)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {level} Risk
    </span>
  );
}

export function riskColorVar(level: RiskLevel) {
  return `var(${STYLES[level].varName})`;
}