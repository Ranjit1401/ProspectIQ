import type { Company, PainPoint, Stakeholder } from "@/types";
import {
  MOCK_COMPANIES,
  getCompanyById,
  getPainPointsByCompany,
  getStakeholdersByCompany,
} from "@/lib/mock-data";

/**
 * The backend does not yet expose a dedicated /accounts resource (only
 * /knowledge, /persona, and /intent as separate calls). These functions
 * return mock data today so the UI is fully previewable; each one is a
 * single async function, so pointing it at a real endpoint later is a
 * one-line change.
 */
export const accountsService = {
  async list(): Promise<Company[]> {
    return MOCK_COMPANIES;
  },

  async getById(id: string): Promise<Company | undefined> {
    return getCompanyById(id);
  },

  async getStakeholders(companyId: string): Promise<Stakeholder[]> {
    return getStakeholdersByCompany(companyId);
  },

  async getPainPoints(companyId: string): Promise<PainPoint[]> {
    return getPainPointsByCompany(companyId);
  },
};
