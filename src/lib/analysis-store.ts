// Lightweight client-side handoff of the latest analysis result between the
// analyze pages and the result page. Persisted in sessionStorage so a refresh
// keeps the result. (Saved reports live in the database.)
import type { AnalysisResult } from "./risk-engine";

const KEY = "pg:last-analysis";

export function storeAnalysis(result: AnalysisResult) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(result));
}

export function loadAnalysis(): AnalysisResult | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}

export function clearAnalysis() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}