import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RotateCcw, Sparkles, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiskBadge } from "@/components/risk-badge";
import { PERMISSIONS, CATEGORY_META, type PermissionCategory } from "@/lib/permissions";
import { analyzeManual } from "@/lib/analysis.functions";
import { storeAnalysis } from "@/lib/analysis-store";

export const Route = createFileRoute("/manual")({
  head: () => ({
    meta: [
      { title: "Manual Permission Analysis — PermissionGuard" },
      {
        name: "description",
        content: "Select Android-style permissions and analyze the privacy and security risk.",
      },
    ],
  }),
  component: ManualPage,
});

const ORDER: PermissionCategory[] = [
  "privacy",
  "surveillance",
  "location",
  "device-control",
  "general",
];

const EXAMPLE = [
  "READ_SMS",
  "READ_CONTACTS",
  "RECORD_AUDIO",
  "ACCESS_BACKGROUND_LOCATION",
  "SYSTEM_ALERT_WINDOW",
  "BIND_ACCESSIBILITY_SERVICE",
];

function ManualPage() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeManual);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [appName, setAppName] = useState("");
  const [appCategory, setAppCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const reset = () => {
    setSelected(new Set());
    setAppName("");
    setAppCategory("");
  };

  const runAnalysis = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one permission to analyze.");
      return;
    }
    setLoading(true);
    try {
      const result = await analyze({
        data: {
          permissionKeys: [...selected],
          appName: appName || undefined,
          appCategory: appCategory || undefined,
        },
      });
      storeAnalysis(result);
      navigate({ to: "/result" });
    } catch {
      toast.error("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Manual Permission Analysis</h1>
        <p className="mt-1 text-muted-foreground">
          Select the permissions an app requests and run a real risk analysis.
        </p>
      </header>

      <Card className="mb-6">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="appName">App name (optional)</Label>
            <Input id="appName" placeholder="e.g. FlashFlight Pro" value={appName} onChange={(e) => setAppName(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="appCategory">App category (optional)</Label>
            <Input id="appCategory" placeholder="e.g. Utilities" value={appCategory} onChange={(e) => setAppCategory(e.target.value)} maxLength={120} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {ORDER.map((cat) => {
          const perms = PERMISSIONS.filter((p) => p.category === cat);
          return (
            <Card key={cat}>
              <CardHeader>
                <CardTitle className="text-base">{CATEGORY_META[cat].label}</CardTitle>
                <p className="text-sm text-muted-foreground">{CATEGORY_META[cat].blurb}</p>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {perms.map((p) => {
                  const checked = selected.has(p.key);
                  return (
                    <div
                      key={p.key}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggle(p.key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggle(p.key);
                        }
                      }}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                        checked
                          ? "border-primary/60 bg-primary/10"
                          : "border-border/60 hover:border-border"
                      }`}
                    >
                      <Checkbox checked={checked} className="mt-0.5 pointer-events-none" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-medium">{p.label}</span>
                          <RiskBadge level={p.riskLevel} />
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {p.description}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="sticky bottom-4 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/90 p-4 backdrop-blur">
        <span className="text-sm text-muted-foreground">
          {selected.size} permission{selected.size === 1 ? "" : "s"} selected
        </span>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setSelected(new Set(EXAMPLE))}>
            <Sparkles className="mr-1 h-4 w-4" /> Try example app
          </Button>
          <Button variant="secondary" onClick={reset}>
            <RotateCcw className="mr-1 h-4 w-4" /> Reset
          </Button>
          <Button onClick={runAnalysis} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <ShieldAlert className="mr-1 h-4 w-4" />
            )}
            Analyze App Risk
          </Button>
        </div>
      </div>
    </div>
  );
}