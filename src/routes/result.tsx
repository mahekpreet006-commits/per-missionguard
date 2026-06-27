import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Save, ScanSearch } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ReportView, toReportViewData } from "@/components/report-view";
import { loadAnalysis } from "@/lib/analysis-store";
import { saveReport } from "@/lib/reports.functions";
import type { AnalysisResult } from "@/lib/risk-engine";

export const Route = createFileRoute("/result")({
  head: () => ({
    meta: [
      { title: "Analysis Result — PermissionGuard" },
      {
        name: "description",
        content:
          "Your PermissionGuard analysis result: privacy and security risk score, dangerous permission combinations and a detailed permission breakdown.",
      },
      { property: "og:title", content: "Analysis Result — PermissionGuard" },
      {
        property: "og:description",
        content:
          "Your PermissionGuard analysis result: risk score, dangerous combinations and a detailed permission breakdown.",
      },
      { property: "og:url", content: "https://per-missionguard.lovable.app/result" },
    ],
    links: [{ rel: "canonical", href: "https://per-missionguard.lovable.app/result" }],
  }),
  component: ResultPage,
});

function ResultPage() {
  const navigate = useNavigate();
  const save = useServerFn(saveReport);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setResult(loadAnalysis());
    setReady(true);
  }, []);

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const { id } = await save({
        data:
          result.analysisMode === "manifest"
            ? {
                analysisMode: "manifest",
                input: result.originalInput,
                appName: result.appName,
                appCategory: result.appCategory ?? undefined,
              }
            : {
                analysisMode: "manual",
                permissionKeys: result.permissions.map((p) => p.key),
                appName: result.appName,
                appCategory: result.appCategory ?? undefined,
              },
      });
      toast.success("Report saved.");
      navigate({ to: "/report/$id", params: { id } });
    } catch {
      toast.error("Could not save the report.");
    } finally {
      setSaving(false);
    }
  };

  const copySummary = async () => {
    if (!result) return;
    const text = [
      `PermissionGuard report — ${result.appName}`,
      `Verdict: ${result.verdict} (score ${result.score})`,
      `Permissions: ${result.permissions.map((p) => p.key).join(", ")}`,
      result.dangerousCombinations.length
        ? `Dangerous combinations: ${result.dangerousCombinations.map((c) => c.name).join("; ")}`
        : "No dangerous combinations.",
    ].join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Summary copied to clipboard.");
  };

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ScanSearch className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">No analysis to show</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Run an analysis first, then your report will appear here.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild>
            <Link to="/manual">Manual analysis</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/manifest">Manifest analysis</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analysis Report</h1>
          <p className="text-sm text-muted-foreground">Generated from the permissions you submitted.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={copySummary}>
            <Copy className="mr-1 h-4 w-4" /> Copy
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Save report
          </Button>
        </div>
      </div>
      <ReportView data={toReportViewData(result)} />
    </div>
  );
}