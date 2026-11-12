import type { BuyingSignal, Company, PainPoint, Stakeholder, ResearchStatus } from "@/types";
import { workspaceService, type WorkspaceCompanySummary } from "./workspace.service";

function toCompany(summary: WorkspaceCompanySummary): Company {
  return {
    id: String(summary.company_id),
    name: summary.company || "Company",
    industry: summary.industry || "Technology",
    employees: "1,000+",
    revenue: "—",
    score: Math.round(summary.latest_intent ?? 50),
    status: (summary.total_analyses > 0 ? "analyzed" : "queued") as ResearchStatus,
    country: "USA",
    logoInitial: summary.company?.[0]?.toUpperCase() ?? "?",
  };
}

export const accountsService = {
  async list(): Promise<Company[]> {
    const summaries = await workspaceService.listCompanies();
    return (summaries ?? []).map(toCompany);
  },

  async getById(id: string): Promise<Company | undefined> {
    const all = await accountsService.list();
    return all.find((c) => c.id === id);
  },

  async getStakeholders(companyId: string): Promise<Stakeholder[]> {
    return workspaceService.getStakeholders(companyId) as Promise<Stakeholder[]>;
  },

  async getPainPoints(companyId: string): Promise<PainPoint[]> {
    return workspaceService.getPainPoints(companyId) as Promise<PainPoint[]>;
  },

  async getBuyingSignals(companyId: string): Promise<BuyingSignal[]> {
    return workspaceService.getBuyingSignals(companyId) as Promise<BuyingSignal[]>;
  },

  async deleteCompany(companyId: string): Promise<{ success: boolean; message: string }> {
    return workspaceService.deleteCompany(companyId);
  },
};
