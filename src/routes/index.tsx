import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  Binary,
  BookOpen,
  ListChecks,
  ScanSearch,
  ShieldCheck,
  Skull,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge } from "@/components/risk-badge";
import { getReports, type ReportRow } from "@/lib/reports.functions";
import type { RiskLevel } from "@/lib/permissions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PermissionGuard — Analyze Mobile App Permission Risk" },
      {
        name: "description",
        content:
          "Find out how risky a mobile app is from its permissions. Real rule-based privacy and security scoring with dangerous combination detection.",
      },
      { property: "og:title", content: "PermissionGuard — Mobile App Risk Analyzer" },
      {
        property: "og:description",
        content:
          "Analyze mobile app permissions with a real rule-based engine — privacy and security scoring plus dangerous combination detection.",
      },
      { property: "og:url", content: "https://per-missionguard.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://per-missionguard.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "PermissionGuard",
          url: "https://per-missionguard.lovable.app/",
          description:
            "Mobile app permission and privacy risk analyzer with rule-based scoring.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "PermissionGuard",
          url: "https://per-missionguard.lovable.app/",
          logo: "https://per-missionguard.lovable.app/favicon-32.png",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "PermissionGuard",
          applicationCategory: "SecurityApplication",
          operatingSystem: "Web",
          url: "https://per-missionguard.lovable.app/",
          description:
            "Analyze Android-style app permissions with a rule-based engine that scores privacy and security risk and flags dangerous permission combinations.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  const fetchReports = useServerFn(getReports);
  const { data: reports } = useQuery({
    queryKey: ["reports", "recent"],
    queryFn: () => fetchReports(),
  });
  const recent = (reports ?? []).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <section className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <ShieldCheck className="h-3.5 w-3.5" /> Mobile App Permission & Privacy Risk Analyzer
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Know what an app can <span className="text-primary">really</span> do
          before you install it
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          PermissionGuard analyzes Android-style permissions with a real
          rule-based engine — scoring risk, flagging dangerous combinations and
          revealing exactly what personal data an app can access.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/manual">
              Start Analysis <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/dictionary">
              <BookOpen className="mr-1 h-4 w-4" /> Permission Dictionary
            </Link>
          </Button>
        </div>
      </section>

      {/* Mode cards */}
      <section className="mt-14 grid gap-5 md:grid-cols-2">
        <ModeCard
          to="/manual"
          icon={ListChecks}
          title="Manual Permission Analysis"
          desc="Pick permissions from grouped, categorized cards and instantly score the risk."
          cta="Select permissions"
        />
        <ModeCard
          to="/manifest"
          icon={Binary}
          title="Permission List / Manifest Analysis"
          desc="Paste raw manifest text or a permission list. We parse, normalize and analyze it."
          cta="Paste a list"
        />
      </section>

      {/* Features */}
      <section className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Feature icon={Zap} title="Rule-based scoring" desc="Every permission has a real weighted score — no random results." />
        <Feature icon={Skull} title="Combination detection" desc="Spyware and banking-trojan permission patterns are flagged." />
        <Feature icon={ScanSearch} title="Data exposure" desc="See precisely what data and capabilities are exposed." />
        <Feature icon={BookOpen} title="Saved reports" desc="Store analyses and revisit them in the dashboard." />
      </section>

      {/* Recent reports */}
      {recent.length > 0 && (
        <section className="mt-14">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent saved reports</h2>
            <Link to="/dashboard" className="text-sm text-primary hover:underline">
              View dashboard
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {recent.map((r: ReportRow) => (
              <Link key={r.id} to="/report/$id" params={{ id: r.id }}>
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{r.app_name}</span>
                      <RiskBadge level={r.verdict as RiskLevel} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Score {r.score} ·{" "}
                      {Array.isArray(r.permissions_detected)
                        ? r.permissions_detected.length
                        : 0}{" "}
                      permissions
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ModeCard({
  to,
  icon: Icon,
  title,
  desc,
  cta,
}: {
  to: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <Link to={to}>
      <Card className="group h-full transition-all hover:-translate-y-0.5 hover:border-primary/50">
        <CardContent className="p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <Icon className="h-5 w-5" />
          </span>
          <h3 className="mt-4 text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
            {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <Icon className="h-5 w-5 text-primary" />
        <h4 className="mt-3 font-medium">{title}</h4>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}
