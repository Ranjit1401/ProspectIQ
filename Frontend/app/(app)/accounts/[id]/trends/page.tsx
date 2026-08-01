import { notFound } from "next/navigation";
import { ResearchActivityLineChart } from "@/components/accounts/research-activity-line";
import { TrustDistributionChart } from "@/components/accounts/trust-distribution-chart";
import { ResearchStatusDonut } from "@/components/accounts/research-status-donut";
import { PainPointsBarChart } from "@/components/accounts/pain-points-bar";
import { MOCK_COMPANIES, getCompanyById } from "@/lib/mock-data";

export function generateStaticParams() {
  return MOCK_COMPANIES.map((c) => ({ id: c.id }));
}

export default async function CompanyTrendsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = getCompanyById(id);
  if (!company) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-medium text-white/70">{company.name} — Trends &amp; Activity</h2>
        <p className="text-xs text-white/35">Research cadence, confidence distribution, and signal trends for this account.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ResearchActivityLineChart />
        <TrustDistributionChart />
        <ResearchStatusDonut />
        <PainPointsBarChart />
      </div>
    </div>
  );
}
