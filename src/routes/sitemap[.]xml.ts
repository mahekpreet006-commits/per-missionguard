import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// Absolute base URL so every <loc> is a fully-qualified https:// URL.
// Crawlers ignore relative <loc> entries.
const BASE_URL = "https://per-missionguard.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "weekly" | "monthly";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Static, indexable content routes.
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/manual", changefreq: "monthly", priority: "0.8" },
          { path: "/manifest", changefreq: "monthly", priority: "0.8" },
          { path: "/dictionary", changefreq: "monthly", priority: "0.7" },
          { path: "/dashboard", changefreq: "weekly", priority: "0.6" },
        ];

        // Dynamic /report/$id routes — one entry per real saved report.
        // Mirrors the report route's data source (public reports table).
        try {
          const { getPublicSupabase } = await import("../lib/reports.server");
          const supabase = getPublicSupabase();
          const { data } = await supabase
            .from("reports")
            .select("id, created_at")
            .order("created_at", { ascending: false });
          for (const row of data ?? []) {
            entries.push({
              path: `/report/${row.id}`,
              lastmod: row.created_at
                ? new Date(row.created_at).toISOString().slice(0, 10)
                : undefined,
              changefreq: "monthly",
              priority: "0.5",
            });
          }
        } catch {
          // If the data source is unavailable, still return the static sitemap.
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});