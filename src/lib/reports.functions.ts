// =============================================================================
// Server functions for saving / reading / deleting analysis reports.
// All scoring is re-computed on the server here so stored values are always
// real engine output, never client-supplied numbers.
// =============================================================================
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { analyzePermissions, type AnalysisResult } from "./risk-engine";
import { parsePermissionInput, getPermission } from "./permissions";

export interface ReportRow {
  id: string;
  app_name: string;
  app_category: string | null;
  analysis_mode: string;
  original_input: string | null;
  permissions_detected: AnalysisResult["permissions"];
  score: number;
  verdict: string;
  risk_categories: AnalysisResult["riskCategories"];
  dangerous_combinations: AnalysisResult["dangerousCombinations"];
  warnings: string[];
  created_at: string;
}

const saveSchema = z.object({
  analysisMode: z.enum(["manual", "manifest"]),
  appName: z.string().max(120).optional(),
  appCategory: z.string().max(120).optional(),
  permissionKeys: z.array(z.string()).max(100).optional(),
  input: z.string().max(20000).optional(),
});

/** Save a report — analysis is recomputed server-side before insert. */
export const saveReport = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ data }): Promise<{ id: string }> => {
    let result: AnalysisResult;
    if (data.analysisMode === "manifest") {
      const { recognized, ignored } = parsePermissionInput(data.input ?? "");
      result = analyzePermissions({
        permissionKeys: recognized,
        appName: data.appName,
        appCategory: data.appCategory ?? null,
        analysisMode: "manifest",
        originalInput: data.input ?? "",
        ignoredLines: ignored,
      });
    } else {
      const keys = (data.permissionKeys ?? []).filter((k) => getPermission(k));
      result = analyzePermissions({
        permissionKeys: keys,
        appName: data.appName,
        appCategory: data.appCategory ?? null,
        analysisMode: "manual",
        originalInput: keys.join("\n"),
      });
    }

    // Writes go through the privileged server client (bypasses RLS).
    // Public anon INSERT is intentionally disallowed at the database level.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabase = supabaseAdmin;
    const { data: inserted, error } = await supabase
      .from("reports")
      .insert({
        app_name: result.appName,
        app_category: result.appCategory,
        analysis_mode: result.analysisMode,
        original_input: result.originalInput,
        permissions_detected: result.permissions as unknown as never,
        score: result.score,
        verdict: result.verdict,
        risk_categories: result.riskCategories as unknown as never,
        dangerous_combinations: result.dangerousCombinations as unknown as never,
        warnings: result.warnings as unknown as never,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

/** List all saved reports (newest first). */
export const getReports = createServerFn({ method: "GET" }).handler(
  async (): Promise<ReportRow[]> => {
    const { getPublicSupabase } = await import("./reports.server");
    const supabase = getPublicSupabase();
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ReportRow[];
  },
);

/** Get a single report by id. */
export const getReport = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<ReportRow | null> => {
    const { getPublicSupabase } = await import("./reports.server");
    const supabase = getPublicSupabase();
    const { data: row, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as unknown as ReportRow) ?? null;
  });

/** Delete a report. */
export const deleteReport = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    // Deletes go through the privileged server client (bypasses RLS).
    // Public anon DELETE is intentionally disallowed at the database level.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabase = supabaseAdmin;
    const { error } = await supabase.from("reports").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export interface DashboardStats {
  totalScans: number;
  highRiskScans: number;
  criticalScans: number;
  mostCommonDangerousPermission: string | null;
}

/** Aggregate dashboard stats from real saved reports. */
export const getDashboardStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardStats> => {
    const { getPublicSupabase } = await import("./reports.server");
    const supabase = getPublicSupabase();
    const { data, error } = await supabase
      .from("reports")
      .select("verdict, permissions_detected");
    if (error) throw new Error(error.message);

    const rows = data ?? [];
    let high = 0;
    let critical = 0;
    const counter = new Map<string, number>();
    const RISKY = new Set(["High", "Critical"]);

    for (const r of rows) {
      if (r.verdict === "High") high += 1;
      if (r.verdict === "Critical") critical += 1;
      const perms = (r.permissions_detected ?? []) as Array<{ label: string; riskLevel: string }>;
      for (const p of perms) {
        if (RISKY.has(p.riskLevel)) {
          counter.set(p.label, (counter.get(p.label) ?? 0) + 1);
        }
      }
    }

    let mostCommon: string | null = null;
    let max = 0;
    for (const [label, count] of counter) {
      if (count > max) {
        max = count;
        mostCommon = label;
      }
    }

    return {
      totalScans: rows.length,
      highRiskScans: high,
      criticalScans: critical,
      mostCommonDangerousPermission: mostCommon,
    };
  },
);