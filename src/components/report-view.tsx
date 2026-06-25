import {
  AlertTriangle,
  CalendarClock,
  FileText,
  Layers,
  Lightbulb,
  ShieldAlert,
  Skull,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreMeter } from "@/components/score-meter";
import { RiskBadge, riskColorVar } from "@/components/risk-badge";
import type {
  AnalysisResult,
  DangerousCombination,
  RiskCategoryFinding,
  ScoredPermission,
} from "@/lib/risk-engine";
import type { RiskLevel } from "@/lib/permissions";

export interface ReportViewData {
  appName: string;
  appCategory: string | null;
  analysisMode: string;
  score: number;
  verdict: RiskLevel;
  permissions: ScoredPermission[];
  riskCategories: RiskCategoryFinding[];
  dangerousCombinations: DangerousCombination[];
  warnings: string[];
  createdAt: string;
  ignoredLines?: string[];
}

export function toReportViewData(r: AnalysisResult): ReportViewData {
  return {
    appName: r.appName,
    appCategory: r.appCategory,
    analysisMode: r.analysisMode,
    score: r.score,
    verdict: r.verdict,
    permissions: r.permissions,
    riskCategories: r.riskCategories,
    dangerousCombinations: r.dangerousCombinations,
    warnings: r.warnings,
    createdAt: r.createdAt,
    ignoredLines: r.ignoredLines,
  };
}

const CHART_COLORS: Record<string, string> = {
  privacy: "var(--chart-1)",
  surveillance: "var(--chart-3)",
  location: "var(--chart-4)",
  "device-control": "var(--chart-2)",
  general: "var(--chart-5)",
};

function catLabel(cat: string) {
  return (
    {
      privacy: "Privacy",
      surveillance: "Surveillance",
      location: "Location",
      "device-control": "Device Control",
      general: "General",
    }[cat] ?? cat
  );
}

export function ReportView({ data }: { data: ReportViewData }) {
  const breakdown = Object.values(
    data.permissions.reduce<Record<string, { name: string; value: number; cat: string }>>(
      (acc, p) => {
        acc[p.category] ??= { name: catLabel(p.category), value: 0, cat: p.category };
        acc[p.category].value += 1;
        return acc;
      },
      {},
    ),
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr]">
          <div className="flex items-center justify-center">
            <ScoreMeter score={data.score} verdict={data.verdict} />
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{data.appName}</h2>
              <RiskBadge level={data.verdict} size="md" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat icon={Layers} label="Permissions" value={String(data.permissions.length)} />
              <Stat icon={ShieldAlert} label="Risk Score" value={String(data.score)} />
              <Stat icon={Skull} label="Risky Combos" value={String(data.dangerousCombinations.length)} />
              <Stat
                icon={FileText}
                label="Mode"
                value={data.analysisMode === "manual" ? "Manual" : "Manifest"}
              />
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              {new Date(data.createdAt).toLocaleString()}
              {data.appCategory ? ` · ${data.appCategory}` : ""}
            </p>
          </div>
        </CardContent>
      </Card>

      {data.permissions.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No supported permissions were detected in this analysis.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risk categories */}
        {data.riskCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4 text-primary" /> Risk Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.riskCategories.map((c) => (
                <div key={c.id} className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{c.title}</span>
                    <RiskBadge level={c.severity} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Category chart */}
        {breakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Permission Categories</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
              <DonutChart segments={breakdown} />
              <div className="flex flex-1 flex-col gap-2 text-sm">
                {breakdown.map((b) => (
                  <div key={b.cat} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: CHART_COLORS[b.cat] ?? "var(--chart-5)" }}
                      />
                      {b.name}
                    </span>
                    <span className="text-muted-foreground">{b.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dangerous combinations */}
      {data.dangerousCombinations.length > 0 && (
        <Card className="border-risk-critical/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Skull className="h-4 w-4 text-risk-critical" /> Dangerous Combinations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.dangerousCombinations.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border p-4"
                style={{
                  borderColor: `color-mix(in oklch, ${riskColorVar(c.severity)} 45%, transparent)`,
                  background: `color-mix(in oklch, ${riskColorVar(c.severity)} 8%, transparent)`,
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">+{c.points} pts</span>
                    <RiskBadge level={c.severity} />
                  </div>
                </div>
                <p className="mt-2 text-sm">{c.why}</p>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-risk-high">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {c.abuse}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Permission findings */}
      {data.permissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detected Permissions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {data.permissions.map((p) => (
              <div key={p.key} className="rounded-lg border border-border/60 bg-secondary/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{p.label}</span>
                  <RiskBadge level={p.riskLevel} />
                </div>
                <code className="mt-1 block truncate text-[11px] text-muted-foreground">
                  {p.androidName}
                </code>
                <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="text-foreground/80">Accesses:</span> {p.dataAccess}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {data.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-primary" /> Analyst Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {data.ignoredLines && data.ignoredLines.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Ignored {data.ignoredLines.length} unrecognized line(s) during parsing.
        </p>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="mt-2 text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}