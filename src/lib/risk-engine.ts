// =============================================================================
// PermissionGuard — Rule-based Risk Analysis Engine
// -----------------------------------------------------------------------------
// Pure, deterministic analysis logic. Given a set of permission keys it returns
// a real risk score, verdict, capability findings and dangerous combinations.
// There is NO randomness and NO hardcoded verdict — the output is entirely a
// function of the permissions passed in.
// =============================================================================

import {
  PERMISSIONS,
  getPermission,
  type RiskLevel,
  type PermissionDef,
} from "./permissions";

export interface ScoredPermission {
  key: string;
  androidName: string;
  label: string;
  category: PermissionDef["category"];
  points: number;
  riskLevel: RiskLevel;
  description: string;
  dataAccess: string;
  whyDangerous: string;
}

export interface RiskCategoryFinding {
  id: string;
  title: string;
  description: string;
  severity: RiskLevel;
  triggeredBy: string[];
}

export interface DangerousCombination {
  id: string;
  name: string;
  severity: RiskLevel;
  points: number;
  why: string;
  abuse: string;
  triggeredBy: string[];
}

export interface AnalysisResult {
  appName: string;
  appCategory: string | null;
  analysisMode: "manual" | "manifest";
  originalInput: string;
  permissions: ScoredPermission[];
  ignoredLines: string[];
  baseScore: number;
  combinationScore: number;
  score: number;
  verdict: RiskLevel;
  riskCategories: RiskCategoryFinding[];
  dangerousCombinations: DangerousCombination[];
  warnings: string[];
  mostDangerousPermission: string | null;
  categoryBreakdown: { category: string; label: string; count: number; points: number }[];
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Verdict classification from a numeric score.
// -----------------------------------------------------------------------------
export function classifyVerdict(score: number): RiskLevel {
  if (score <= 20) return "Low";
  if (score <= 45) return "Moderate";
  if (score <= 75) return "High";
  return "Critical";
}

const has = (set: Set<string>, ...keys: string[]) => keys.every((k) => set.has(k));
const hasAny = (set: Set<string>, ...keys: string[]) => keys.some((k) => set.has(k));

// -----------------------------------------------------------------------------
// Capability / risk-category detection rules.
// -----------------------------------------------------------------------------
function detectRiskCategories(set: Set<string>): RiskCategoryFinding[] {
  const findings: RiskCategoryFinding[] = [];

  // Personal data access
  const personal = ["READ_CONTACTS", "WRITE_CONTACTS", "READ_CALL_LOG", "WRITE_CALL_LOG", "READ_SMS", "SEND_SMS", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO"].filter((k) => set.has(k));
  if (personal.length) {
    findings.push({
      id: "personal-data",
      title: "Personal Data Access",
      description: "The app can read private information such as contacts, messages, call history or files.",
      severity: personal.length >= 3 ? "High" : "Moderate",
      triggeredBy: personal,
    });
  }

  // Communication monitoring
  const comms = ["READ_SMS", "SEND_SMS", "READ_CALL_LOG", "WRITE_CALL_LOG", "NOTIFICATION_ACCESS"].filter((k) => set.has(k));
  if (comms.length) {
    findings.push({
      id: "communication",
      title: "Communication Monitoring",
      description: "The app can access private communications including messages, calls or notifications.",
      severity: comms.length >= 2 ? "High" : "Moderate",
      triggeredBy: comms,
    });
  }

  // Surveillance capability
  const surveil = ["CAMERA", "RECORD_AUDIO", "SCREEN_CAPTURE", "NOTIFICATION_ACCESS"].filter((k) => set.has(k));
  if (surveil.length) {
    findings.push({
      id: "surveillance",
      title: "Surveillance Capability",
      description: "The app can monitor or record you through the camera, microphone, screen or notifications.",
      severity: surveil.length >= 2 ? "High" : "Moderate",
      triggeredBy: surveil,
    });
  }

  // Location tracking
  const loc = ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "ACCESS_BACKGROUND_LOCATION"].filter((k) => set.has(k));
  if (loc.length) {
    findings.push({
      id: "location",
      title: "Location Tracking",
      description: set.has("ACCESS_BACKGROUND_LOCATION")
        ? "The app can track your location continuously, even in the background."
        : "The app can determine your physical location.",
      severity: set.has("ACCESS_BACKGROUND_LOCATION") ? "Critical" : "Moderate",
      triggeredBy: loc,
    });
  }

  // Device control / manipulation
  const control = ["BIND_ACCESSIBILITY_SERVICE", "SYSTEM_ALERT_WINDOW", "REQUEST_INSTALL_PACKAGES", "DEVICE_ADMIN", "PACKAGE_USAGE_STATS"].filter((k) => set.has(k));
  if (control.length) {
    findings.push({
      id: "device-control",
      title: "Device Control & Manipulation",
      description: "The app can control the interface, overlay screens, install software or administer the device — behaviour common in malware.",
      severity: control.length >= 2 ? "Critical" : "High",
      triggeredBy: control,
    });
  }

  return findings;
}

// -----------------------------------------------------------------------------
// Dangerous permission combination rules. Each adds extra risk points.
// -----------------------------------------------------------------------------
function detectCombinations(set: Set<string>): DangerousCombination[] {
  const combos: DangerousCombination[] = [];

  // 1. SMS + Contacts + Microphone -> spyware behaviour
  if (hasAny(set, "READ_SMS", "SEND_SMS") && set.has("READ_CONTACTS") && set.has("RECORD_AUDIO")) {
    combos.push({
      id: "spyware-core",
      name: "SMS + Contacts + Microphone",
      severity: "Critical",
      points: 20,
      why: "Reading messages, harvesting contacts and recording audio together is a classic spyware profile.",
      abuse: "Possible spyware: exfiltrate messages and contacts while eavesdropping.",
      triggeredBy: ["READ_SMS/SEND_SMS", "READ_CONTACTS", "RECORD_AUDIO"],
    });
  }

  // 2. Background Location + Camera + Microphone -> continuous surveillance
  if (set.has("ACCESS_BACKGROUND_LOCATION") && set.has("CAMERA") && set.has("RECORD_AUDIO")) {
    combos.push({
      id: "continuous-surveillance",
      name: "Background Location + Camera + Microphone",
      severity: "Critical",
      points: 22,
      why: "Continuous location plus camera and microphone enables always-on monitoring.",
      abuse: "Stalkerware-style continuous surveillance and tracking.",
      triggeredBy: ["ACCESS_BACKGROUND_LOCATION", "CAMERA", "RECORD_AUDIO"],
    });
  }

  // 3. Accessibility + Overlay + SMS -> banking trojan
  if (set.has("BIND_ACCESSIBILITY_SERVICE") && set.has("SYSTEM_ALERT_WINDOW") && hasAny(set, "READ_SMS", "SEND_SMS")) {
    combos.push({
      id: "banking-trojan",
      name: "Accessibility + Overlay + SMS",
      severity: "Critical",
      points: 28,
      why: "Can read the screen, draw fake overlays and intercept SMS one-time passwords.",
      abuse: "Banking-trojan behaviour: steal credentials via fake overlays and bypass 2FA.",
      triggeredBy: ["BIND_ACCESSIBILITY_SERVICE", "SYSTEM_ALERT_WINDOW", "READ_SMS/SEND_SMS"],
    });
  }

  // 4. Contacts + Call Logs + SMS + Location -> data harvesting
  if (set.has("READ_CONTACTS") && set.has("READ_CALL_LOG") && hasAny(set, "READ_SMS", "SEND_SMS") && hasAny(set, "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "ACCESS_BACKGROUND_LOCATION")) {
    combos.push({
      id: "data-harvesting",
      name: "Contacts + Call Logs + SMS + Location",
      severity: "Critical",
      points: 18,
      why: "Combines every major personal data source into a single profile.",
      abuse: "Large-scale personal data harvesting and profiling.",
      triggeredBy: ["READ_CONTACTS", "READ_CALL_LOG", "READ_SMS/SEND_SMS", "LOCATION"],
    });
  }

  // 5. Install Packages + Accessibility + Device Admin -> device takeover
  if (set.has("REQUEST_INSTALL_PACKAGES") && set.has("BIND_ACCESSIBILITY_SERVICE") && set.has("DEVICE_ADMIN")) {
    combos.push({
      id: "device-takeover",
      name: "Install Packages + Accessibility + Device Admin",
      severity: "Critical",
      points: 30,
      why: "Can install software, control the UI and resist removal simultaneously.",
      abuse: "Extremely high device-takeover risk; near-total control of the device.",
      triggeredBy: ["REQUEST_INSTALL_PACKAGES", "BIND_ACCESSIBILITY_SERVICE", "DEVICE_ADMIN"],
    });
  }

  // 6. Notification Access + SMS + Contacts -> message monitoring
  if (set.has("NOTIFICATION_ACCESS") && hasAny(set, "READ_SMS", "SEND_SMS") && set.has("READ_CONTACTS")) {
    combos.push({
      id: "message-monitoring",
      name: "Notification Access + SMS + Contacts",
      severity: "High",
      points: 15,
      why: "Reads notifications and messages while knowing exactly who you talk to.",
      abuse: "Message monitoring and privacy leakage, including 2FA interception.",
      triggeredBy: ["NOTIFICATION_ACCESS", "READ_SMS/SEND_SMS", "READ_CONTACTS"],
    });
  }

  // 7. Overlay + Accessibility (without SMS) -> screen manipulation
  if (set.has("SYSTEM_ALERT_WINDOW") && set.has("BIND_ACCESSIBILITY_SERVICE") && !combos.some((c) => c.id === "banking-trojan")) {
    combos.push({
      id: "screen-manipulation",
      name: "Overlay + Accessibility",
      severity: "Critical",
      points: 20,
      why: "Can draw over other apps and read/control the interface.",
      abuse: "Overlay attacks and silent automation of on-screen actions.",
      triggeredBy: ["SYSTEM_ALERT_WINDOW", "BIND_ACCESSIBILITY_SERVICE"],
    });
  }

  return combos;
}

// -----------------------------------------------------------------------------
// Recommendations (plain-language, derived from findings).
// -----------------------------------------------------------------------------
function buildWarnings(
  set: Set<string>,
  verdict: RiskLevel,
  combos: DangerousCombination[],
): string[] {
  const warnings: string[] = [];

  if (verdict === "Critical") {
    warnings.push("This permission set strongly resembles spyware or invasive tracking behaviour. Treat this app with extreme caution.");
  } else if (verdict === "High") {
    warnings.push("This app requests a high number of sensitive permissions. Verify it genuinely needs each one.");
  }

  if (set.has("BIND_ACCESSIBILITY_SERVICE")) {
    warnings.push("Avoid granting Accessibility Service unless absolutely necessary — it can read and control everything on screen.");
  }
  if (set.has("ACCESS_BACKGROUND_LOCATION")) {
    warnings.push("Background location allows persistent tracking. Restrict location to 'while using the app' where possible.");
  }
  if (hasAny(set, "READ_SMS", "SEND_SMS") && set.has("READ_CONTACTS") && set.has("RECORD_AUDIO")) {
    warnings.push("Be very cautious with apps requesting SMS, contacts and microphone together.");
  }
  if (set.has("SYSTEM_ALERT_WINDOW")) {
    warnings.push("'Draw over other apps' enables overlay attacks that fake legitimate screens.");
  }
  if (combos.length) {
    warnings.push("Dangerous permission combinations were detected — these are far riskier together than individually.");
  }
  warnings.push("Review whether the app really needs these permissions, and revoke anything that is not essential.");

  return warnings;
}

// -----------------------------------------------------------------------------
// Main entry point.
// -----------------------------------------------------------------------------
export function analyzePermissions(params: {
  permissionKeys: string[];
  appName?: string;
  appCategory?: string | null;
  analysisMode: "manual" | "manifest";
  originalInput?: string;
  ignoredLines?: string[];
}): AnalysisResult {
  // De-duplicate and keep only supported keys.
  const set = new Set(params.permissionKeys.filter((k) => getPermission(k)));

  const permissions: ScoredPermission[] = [...set]
    .map((k) => getPermission(k)!)
    .sort((a, b) => b.baseRiskScore - a.baseRiskScore)
    .map((p) => ({
      key: p.key,
      androidName: p.androidName,
      label: p.label,
      category: p.category,
      points: p.baseRiskScore,
      riskLevel: p.riskLevel,
      description: p.description,
      dataAccess: p.dataAccess,
      whyDangerous: p.whyDangerous,
    }));

  const baseScore = permissions.reduce((sum, p) => sum + p.points, 0);
  const dangerousCombinations = detectCombinations(set);
  const combinationScore = dangerousCombinations.reduce((s, c) => s + c.points, 0);
  const score = baseScore + combinationScore;
  const verdict = classifyVerdict(score);
  const riskCategories = detectRiskCategories(set);
  const warnings = buildWarnings(set, verdict, dangerousCombinations);

  const mostDangerousPermission = permissions.length ? permissions[0].label : null;

  // Category breakdown for charts.
  const breakdownMap = new Map<string, { label: string; count: number; points: number }>();
  for (const p of permissions) {
    const meta = PERMISSIONS.find((x) => x.key === p.key)!;
    const existing = breakdownMap.get(p.category) ?? { label: catLabel(p.category), count: 0, points: 0 };
    existing.count += 1;
    existing.points += meta.baseRiskScore;
    breakdownMap.set(p.category, existing);
  }
  const categoryBreakdown = [...breakdownMap.entries()].map(([category, v]) => ({
    category,
    label: v.label,
    count: v.count,
    points: v.points,
  }));

  return {
    appName: params.appName?.trim() || "Unnamed App",
    appCategory: params.appCategory?.trim() || null,
    analysisMode: params.analysisMode,
    originalInput: params.originalInput ?? "",
    permissions,
    ignoredLines: params.ignoredLines ?? [],
    baseScore,
    combinationScore,
    score,
    verdict,
    riskCategories,
    dangerousCombinations,
    warnings,
    mostDangerousPermission,
    categoryBreakdown,
    createdAt: new Date().toISOString(),
  };
}

function catLabel(category: string): string {
  switch (category) {
    case "privacy":
      return "Privacy";
    case "surveillance":
      return "Surveillance";
    case "location":
      return "Location";
    case "device-control":
      return "Device Control";
    default:
      return "General";
  }
}