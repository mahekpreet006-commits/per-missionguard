import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  head: () => ({ meta: [{ title: "Saved Report — PermissionGuard" }] }),
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
  const navigate = useNavigate();
  const fetchReport = useServerFn(getReport);
  const remove = useServerFn(deleteReport);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["report", id],
    queryFn: () => fetchReport({ data: { id } }),
  });

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

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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