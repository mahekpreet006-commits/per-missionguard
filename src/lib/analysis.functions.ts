// =============================================================================
// Server functions that run the risk engine on the backend.
// The frontend never computes scores itself — it calls these.
// =============================================================================
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { analyzePermissions, type AnalysisResult } from "./risk-engine";
import { parsePermissionInput, getPermission } from "./permissions";

const manualSchema = z.object({
  permissionKeys: z.array(z.string()).max(100),
  appName: z.string().max(120).optional(),
  appCategory: z.string().max(120).optional(),
});

/** Analyze a manually selected set of permissions. */
export const analyzeManual = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => manualSchema.parse(data))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const validKeys = data.permissionKeys.filter((k) => getPermission(k));
    return analyzePermissions({
      permissionKeys: validKeys,
      appName: data.appName,
      appCategory: data.appCategory ?? null,
      analysisMode: "manual",
      originalInput: validKeys.join("\n"),
    });
  });

const manifestSchema = z.object({
  input: z.string().max(20000),
  appName: z.string().max(120).optional(),
  appCategory: z.string().max(120).optional(),
});

/** Parse pasted manifest / permission text and analyze it. */
export const analyzeManifest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => manifestSchema.parse(data))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const { recognized, ignored } = parsePermissionInput(data.input);
    return analyzePermissions({
      permissionKeys: recognized,
      appName: data.appName,
      appCategory: data.appCategory ?? null,
      analysisMode: "manifest",
      originalInput: data.input,
      ignoredLines: ignored,
    });
  });