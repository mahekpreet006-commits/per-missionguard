import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ReportView, type ReportViewData } from "@/components/report-view";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getReport, deleteReport, type ReportRow } from "@/lib/reports.functions";
import type { RiskLevel } from "@/lib/permissions";

export const Route = createFileRoute("/report/$id")({
  loader: async ({ params }) => {
    const report = await getReport({ data: { id: params.id } });
    return { report };
  },
  head: ({ params, loaderData }) => {
    const name = loaderData?.report?.app_name;
    const baseUrl = `https://per-missionguard.lovable.app/report/${params.id}`;
    const title = name
      ? `${name} Permission Risk Report — PermissionGuard`.slice(0, 60)
      : "Saved Report — PermissionGuard";
    const description = name
      ? `Permission risk report for ${name}: privacy and security score, dangerous permission combinations and the full list of detected permissions.`.slice(
          0,
          160,
        )
      : "A saved PermissionGuard report: privacy and security risk score, dangerous permission combinations and detected permissions.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: baseUrl },
      ],
      links: [{ rel: "canonical", href: baseUrl }],
    };
  },
  component: ReportDetailPage,
});

function rowToViewData(r: ReportRow): ReportViewData {
  return {
    appName: r.app_name,
    appCategory: r.app_category,
    analysisMode: r.analysis_mode,
    score: r.score,
    verdict: r.verdict as RiskLevel,
    permissions: (r.permissions_detected ?? []) as ReportViewData["permissions"],
    riskCategories: (r.risk_categories ?? []) as ReportViewData["riskCategories"],
    dangerousCombinations: (r.dangerous_combinations ?? []) as ReportViewData["dangerousCombinations"],
    warnings: (r.warnings ?? []) as string[],
    createdAt: r.created_at,
  };
}

function ReportDetailPage() {
  const { id } = Route.useParams();
  const { report } = Route.useLoaderData();
  const navigate = useNavigate();
  const remove = useServerFn(deleteReport);
  const [deleting, setDeleting] = useState(false);

  const data = report;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await remove({ data: { id } });
      toast.success("Report deleted.");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Could not delete the report.");
      setDeleting(false);
    }
  };

  if (!data) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Report not found</h1>
        <Button asChild className="mt-4">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">
        {data.app_name} — Permission Risk Report
      </h1>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard">
            <ArrowLeft className="mr-1 h-4 w-4" /> Dashboard
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={deleting}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this report?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the saved analysis for "{data.app_name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <ReportView data={rowToViewData(data)} />
    </div>
  );
}