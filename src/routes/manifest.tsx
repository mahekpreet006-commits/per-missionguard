import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileCode2, Loader2, RotateCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { analyzeManifest } from "@/lib/analysis.functions";
import { storeAnalysis } from "@/lib/analysis-store";

export const Route = createFileRoute("/manifest")({
  head: () => ({
    meta: [
      { title: "Manifest / Permission List Analysis — PermissionGuard" },
      {
        name: "description",
        content: "Paste an Android manifest or permission list to analyze its privacy risk.",
      },
    ],
  }),
  component: ManifestPage,
});

const EXAMPLE = `android.permission.READ_SMS
android.permission.RECORD_AUDIO
android.permission.ACCESS_BACKGROUND_LOCATION
android.permission.READ_CONTACTS
android.permission.SYSTEM_ALERT_WINDOW
android.permission.BIND_ACCESSIBILITY_SERVICE
android.permission.INTERNET`;

function ManifestPage() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeManifest);
  const [input, setInput] = useState("");
  const [appName, setAppName] = useState("");
  const [appCategory, setAppCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    if (!input.trim()) {
      toast.error("Paste a permission list to analyze.");
      return;
    }
    setLoading(true);
    try {
      const result = await analyze({
        data: {
          input,
          appName: appName || undefined,
          appCategory: appCategory || undefined,
        },
      });
      if (result.permissions.length === 0) {
        toast.error("No supported permissions were found in that input.");
        setLoading(false);
        return;
      }
      storeAnalysis(result);
      navigate({ to: "/result" });
    } catch {
      toast.error("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Manifest / Permission List Analysis</h1>
        <p className="mt-1 text-muted-foreground">
          Paste raw permission names, manifest text, or a list copied from app
          settings. We extract, normalize and de-duplicate them automatically.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="appName">App name (optional)</Label>
              <Input id="appName" placeholder="e.g. FlashFlight Pro" value={appName} onChange={(e) => setAppName(e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appCategory">App category (optional)</Label>
              <Input id="appCategory" placeholder="e.g. Utilities" value={appCategory} onChange={(e) => setAppCategory(e.target.value)} maxLength={120} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="input">Permission list</Label>
            <Textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"android.permission.READ_SMS\nandroid.permission.RECORD_AUDIO\n..."}
              className="min-h-56 font-mono text-sm"
              maxLength={20000}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setInput(EXAMPLE)}>
              <FileCode2 className="mr-1 h-4 w-4" /> Example input
            </Button>
            <Button variant="secondary" onClick={() => setInput("")}>
              <RotateCcw className="mr-1 h-4 w-4" /> Clear
            </Button>
            <Button onClick={runAnalysis} disabled={loading} className="ml-auto">
              {loading ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <ShieldAlert className="mr-1 h-4 w-4" />
              )}
              Analyze
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}