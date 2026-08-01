import { notFound } from "next/navigation";
import { Lightbulb, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OutreachCard } from "@/components/queue/outreach-card";
import {
  MOCK_COMPANIES,
  MOCK_OUTREACH,
  getCompanyById,
  getPainPointsByCompany,
  getStakeholdersByCompany,
} from "@/lib/mock-data";

export function generateStaticParams() {
  return MOCK_COMPANIES.map((c) => ({ id: c.id }));
}

export default async function CompanyRecommendationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = getCompanyById(id);
  if (!company) notFound();

  const stakeholders = getStakeholdersByCompany(id);
  const painPoints = getPainPointsByCompany(id);
  const drafts = MOCK_OUTREACH.filter((o) => o.companyId === id);
  const champion = stakeholders.find((s) => s.influence === "Champion") ?? stakeholders[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-medium text-white/70">{company.name} — Recommendations</h2>
        <p className="text-xs text-white/35">Strategy suggestions and grounded outreach drafts for this account.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-white/50" /> Recommended Motion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[13px] leading-relaxed text-white/55">
            Lead with a platform-consolidation angle to the CTO — engineering leadership has
            publicly flagged fragmented tooling as a blocker, and budget for FY26 infra tooling
            has already been approved.
            {champion && ` ${champion.name} (${champion.title}) is the strongest entry point given their recent engagement.`}
          </p>
          <div className="flex flex-wrap gap-2">
            {painPoints.slice(0, 3).map((p) => (
              <Badge key={p.id} variant={p.severity === "critical" ? "danger" : "outline"}>
                {p.title}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 text-sm font-medium text-white/70">Drafted Outreach</h3>
        {drafts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {drafts.map((draft) => (
              <OutreachCard key={draft.id} draft={draft} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-between p-5 text-[13px] text-white/45">
              No outreach has been drafted for this account yet — generate one from the AI Workspace.
              <ArrowRight className="h-3.5 w-3.5 text-white/25" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
