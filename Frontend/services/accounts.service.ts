import type { Company, PainPoint, Stakeholder, ResearchStatus } from "@/types";
import {
  getCompanyById,
  getPainPointsByCompany,
  getStakeholdersByCompany,
} from "@/lib/mock-data";
import { workspaceService, type WorkspaceCompanySummary } from "./workspace.service";

/**
 * Company-level list now comes from the real backend (GET /workspace/),
 * which reflects whatever you've actually run through the AI Workspace
 * chat. Per-company stakeholders/pain-points still fall back to mock
 * data — the backend doesn't expose dedicated endpoints for those yet.
 */
function toCompany(summary: WorkspaceCompanySummary): Company {
  return {
    id: String(summary.company_id),
    name: summary.company,
    industry: summary.industry || "Unknown",
    employees: "—",
    revenue: "—",
    score: Math.round(summary.latest_intent ?? 0),
    status: (summary.total_analyses > 0 ? "analyzed" : "queued") as ResearchStatus,
    country: "—",
    logoInitial: summary.company?.[0]?.toUpperCase() ?? "?",
  };
}

export const accountsService = {
  async list(): Promise<Company[]> {
    const summaries = await workspaceService.listCompanies();
    return summaries.map(toCompany);
  },

  async getById(id: string): Promise<Company | undefined> {
    const all = await accountsService.list();
    return all.find((c) => c.id === id) ?? getCompanyById(id);
  },

  async getStakeholders(companyId: string): Promise<Stakeholder[]> {
    return getStakeholdersByCompany(companyId);
  },

  async getPainPoints(companyId: string): Promise<PainPoint[]> {
    return getPainPointsByCompany(companyId);
  },
};