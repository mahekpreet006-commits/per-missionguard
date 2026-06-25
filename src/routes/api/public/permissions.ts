import { createFileRoute } from "@tanstack/react-router";
import { PERMISSIONS } from "@/lib/permissions";

// Public read-only API: returns the supported permission definitions and risk
// descriptions used by the analysis engine.
export const Route = createFileRoute("/api/public/permissions")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json(
          { count: PERMISSIONS.length, permissions: PERMISSIONS },
          { headers: { "Cache-Control": "public, max-age=3600" } },
        );
      },
    },
  },
});