import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/risk-badge";
import {
  PERMISSIONS,
  CATEGORY_META,
  type PermissionCategory,
} from "@/lib/permissions";

export const Route = createFileRoute("/dictionary")({
  head: () => ({
    meta: [
      { title: "Permission Dictionary — PermissionGuard" },
      {
        name: "description",
        content: "What each Android permission allows, the data it exposes and why it can be dangerous.",
      },
      { property: "og:title", content: "Permission Dictionary — PermissionGuard" },
      {
        property: "og:description",
        content: "What each Android permission allows, the data it exposes and why it can be dangerous.",
      },
      { property: "og:url", content: "https://per-missionguard.lovable.app/dictionary" },
    ],
    links: [{ rel: "canonical", href: "https://per-missionguard.lovable.app/dictionary" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Permission Dictionary",
          url: "https://per-missionguard.lovable.app/dictionary",
          description:
            "A knowledge base of every supported permission: what it allows, the data it can access and why it may be dangerous.",
        }),
      },
    ],
  }),
  component: DictionaryPage,
});

const CATS: (PermissionCategory | "all")[] = [
  "all",
  "privacy",
  "surveillance",
  "location",
  "device-control",
  "general",
];

function DictionaryPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<PermissionCategory | "all">("all");

  const results = useMemo(() => {
    const q = query.toLowerCase();
    return PERMISSIONS.filter((p) => {
      const matchCat = cat === "all" || p.category === cat;
      const matchQ =
        !q ||
        p.label.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q) ||
        p.androidName.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, cat]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Permission Dictionary</h1>
        <p className="mt-1 text-muted-foreground">
          A knowledge base of every supported permission: what it allows, the
          data it can access and why it may be dangerous.
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search permissions…"
            aria-label="Search permissions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={cat === c ? "default" : "secondary"}
              onClick={() => setCat(c)}
            >
              {c === "all" ? "All" : CATEGORY_META[c].label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {results.map((p) => (
          <Card key={p.key}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-semibold">{p.label}</h2>
                  <code className="block truncate text-[11px] text-muted-foreground">
                    {p.androidName}
                  </code>
                </div>
                <RiskBadge level={p.riskLevel} />
              </div>
              <p className="mt-3 text-sm">{p.description}</p>
              <dl className="mt-3 space-y-1.5 text-xs">
                <div>
                  <dt className="inline font-medium text-foreground/80">Data accessed: </dt>
                  <dd className="inline text-muted-foreground">{p.dataAccess}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-foreground/80">Why dangerous: </dt>
                  <dd className="inline text-muted-foreground">{p.whyDangerous}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-foreground/80">Base score: </dt>
                  <dd className="inline text-muted-foreground">+{p.baseRiskScore}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
      {results.length === 0 && (
        <p className="py-10 text-center text-muted-foreground">No permissions match your search.</p>
      )}
    </div>
  );
}