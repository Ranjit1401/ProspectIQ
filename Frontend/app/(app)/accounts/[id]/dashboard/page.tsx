import { notFound } from "next/navigation";
import { Users, ShieldAlert, TrendingUp, Radio } from "lucide-react";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrustScoreCard, ConfidenceMeter } from "@/components/report/trust-score-card";
import { PainPointsBarChart } from "@/components/accounts/pain-points-bar";
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

export default async function CompanyDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = getCompanyById(id);
  if (!company) notFound();

  const stakeholders = getStakeholdersByCompany(id);
  const painPoints = getPainPointsByCompany(id);
  const signals = MOCK_BUYING_SIGNALS;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-medium text-white/70">{company.name} — Company Dashboard</h2>
        <p className="text-xs text-white/35">A live snapshot of research depth, risk, and momentum for this account.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Trust score" value={String(company.score)} delta={company.status} deltaTone="positive" icon={TrendingUp} />
        <StatCard label="Stakeholders mapped" value={String(stakeholders.length)} icon={Users} />
        <StatCard label="Pain points" value={String(painPoints.length)} deltaTone="negative" icon={ShieldAlert} />
        <StatCard label="Buying signals" value={String(signals.length)} deltaTone="positive" icon={Radio} />
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
            <CardTitle>Account Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-[13px] text-white/60">
            <div className="flex justify-between"><span className="text-white/35">Industry</span><span>{company.industry}</span></div>
            <div className="flex justify-between"><span className="text-white/35">Employees</span><span>{company.employees}</span></div>
            <div className="flex justify-between"><span className="text-white/35">Revenue</span><span>{company.revenue}</span></div>
            <div className="flex justify-between"><span className="text-white/35">Country</span><span>{company.country}</span></div>
            <div className="flex justify-between"><span className="text-white/35">Status</span><span className="capitalize">{company.status.replace("-", " ")}</span></div>
          </CardContent>
        </Card>
      </div>

      <PainPointsBarChart />
    </div>
  );
}
