"use client";

import { Building2, TrendingUp, ShieldCheck, Users } from "lucide-react";
import { StatCard } from "@/components/common/stat-card";
import { ResearchStatusDonut } from "@/components/accounts/research-status-donut";
import { PainPointsBarChart } from "@/components/accounts/pain-points-bar";
import { ResearchActivityLineChart } from "@/components/accounts/research-activity-line";
import { TrustDistributionChart } from "@/components/accounts/trust-distribution-chart";
import { AccountsTable } from "@/components/accounts/accounts-table";

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total accounts" value="29" delta="+4 this week" deltaTone="positive" icon={Building2} />
        <StatCard label="Avg. trust score" value="84" delta="+2.1" deltaTone="positive" icon={TrendingUp} />
        <StatCard label="Guardrail catches" value="7" delta="this week" icon={ShieldCheck} />
        <StatCard label="Stakeholders mapped" value="112" delta="+18" deltaTone="positive" icon={Users} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ResearchStatusDonut />
        <PainPointsBarChart />
        <ResearchActivityLineChart />
        <TrustDistributionChart />
      </div>

      <AccountsTable />
    </div>
  );
}
