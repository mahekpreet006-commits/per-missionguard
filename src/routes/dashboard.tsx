import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertOctagon,
  Inbox,
  Loader2,
  ScanLine,
  Search,
  ShieldAlert,
  Skull,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RiskBadge } from "@/components/risk-badge";
import {
  getReports,
  getDashboardStats,
  deleteReport,
  type ReportRow,
} from "@/lib/reports.functions";
import type { RiskLevel } from "@/lib/permissions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Reports Dashboard — PermissionGuard" },
      { name: "description", content: "View, search, filter and manage saved permission analysis reports." },
    ],
  }),
  component: DashboardPage,
});

const VERDICTS: (RiskLevel | "All")[] = ["All", "Low", "Moderate", "High", "Critical"];

function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchReports = useServerFn(getReports);
  const fetchStats = useServerFn(getDashboardStats);
  const remove = useServerFn(deleteReport);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RiskLevel | "All">("All");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => fetchReports(),
  });
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchStats(),
  });

  const filtered = useMemo(() => {
    return (reports ?? []).filter((r) => {
      const matchesName = r.app_name.toLowerCase().includes(search.toLowerCase());
      const matchesVerdict = filter === "All" || r.verdict === filter;
      return matchesName && matchesVerdict;
    });
  }, [reports, search, filter]);

  const handleDelete = async (id: string) => {
    try {
      await remove({ data: { id } });
      toast.success("Report deleted.");
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch {
      toast.error("Could not delete the report.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Reports Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Every saved analysis, with live stats from your stored reports.
        </p>
      </header>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ScanLine} label="Total scans" value={stats?.totalScans ?? 0} />
        <StatCard icon={ShieldAlert} label="High risk scans" value={stats?.highRiskScans ?? 0} tone="high" />
        <StatCard icon={AlertOctagon} label="Critical risk scans" value={stats?.criticalScans ?? 0} tone="critical" />
        <StatCard
          icon={Skull}
          label="Most common dangerous permission"
          value={stats?.mostCommonDangerousPermission ?? "—"}
          small
        />
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by app name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VERDICTS.map((v) => (
            <Button
              key={v}
              size="sm"
              variant={filter === v ? "default" : "secondary"}
              onClick={() => setFilter(v)}
            >
              {v}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Inbox className="h-9 w-9 text-muted-foreground" />
            <p className="text-muted-foreground">
              {reports?.length ? "No reports match your filters." : "No saved reports yet."}
            </p>
            <Button asChild>
              <Link to="/manual">Run an analysis</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r: ReportRow) => (
            <Card key={r.id} className="transition-colors hover:border-primary/40">
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Link
                    to="/report/$id"
                    params={{ id: r.id }}
                    className="font-medium hover:text-primary"
                  >
                    {r.app_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {r.analysis_mode === "manual" ? "Manual" : "Manifest"} ·{" "}
                    {Array.isArray(r.permissions_detected) ? r.permissions_detected.length : 0}{" "}
                    permissions · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">Score {r.score}</span>
                <RiskBadge level={r.verdict as RiskLevel} />
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(r.id)}
                  aria-label="Delete report"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  small,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: "high" | "critical";
  small?: boolean;
}) {
  const color =
    tone === "critical" ? "var(--risk-critical)" : tone === "high" ? "var(--risk-high)" : "var(--primary)";
  return (
    <Card>
      <CardContent className="p-5">
        <Icon className="h-5 w-5" style={{ color }} />
        <p className={`mt-2 font-bold ${small ? "text-base leading-tight" : "text-2xl tabular-nums"}`}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}