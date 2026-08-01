import { notFound } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrustScoreCard, ConfidenceMeter, EvidenceList } from "@/components/report/trust-score-card";
import { StakeholderCard, PainPointCard } from "@/components/report/stakeholder-card";
import {
  MOCK_COMPANIES,
  getCompanyById,
  getPainPointsByCompany,
  getStakeholdersByCompany,
  MOCK_BUYING_SIGNALS,
} from "@/lib/mock-data";

export function generateStaticParams() {
  return MOCK_COMPANIES.map((c) => ({ id: c.id }));
}

export default async function ExecutiveReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = getCompanyById(id);
  if (!company) notFound();

  const stakeholders = getStakeholdersByCompany(id);
  const painPoints = getPainPointsByCompany(id);
  const evidence = [
    "Q3 engineering blog post referencing platform-strategy fragmentation",
    "FY26 infra tooling budget approval mentioned in earnings call",
    "InfraCon 2025 speaker bio and session transcript",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-base">{company.logoInitial}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold text-white">{company.name}</h2>
            <p className="text-xs text-white/40">
              {company.industry} · {company.employees} employees · {company.revenue}
            </p>
          </div>
        </div>
        <Badge variant="silver">Executive Report</Badge>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <TrustScoreCard score={company.score} />

        <Card>
          <CardHeader>
            <CardTitle>Confidence Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConfidenceMeter label="Data grounding" value={92} />
            <ConfidenceMeter label="Stakeholder accuracy" value={87} />
            <ConfidenceMeter label="Personalization quality" value={81} />
            <ConfidenceMeter label="Guardrail pass rate" value={100} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buying Signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {MOCK_BUYING_SIGNALS.map((signal) => (
              <div key={signal.id} className="rounded-lg border border-white/6 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-white/70">{signal.title}</span>
                  <Badge variant={signal.strength === "strong" ? "success" : "outline"}>{signal.strength}</Badge>
                </div>
                <p className="mt-1 text-[11px] text-white/30">
                  {signal.source} · {signal.detectedAt}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/70">Stakeholders</h3>
          <div className="space-y-3">
            {stakeholders.map((s) => (
              <StakeholderCard key={s.id} stakeholder={s} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/70">Pain Points</h3>
          <div className="space-y-3">
            {painPoints.map((p) => (
              <PainPointCard key={p.id} painPoint={p} />
            ))}
          </div>
        </div>
      </div>

      <EvidenceList items={evidence} />
    </div>
  );
}
