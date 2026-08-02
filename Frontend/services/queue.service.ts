import { apiFetch } from "./api-client";
import type { OutreachDraft } from "@/types";

export const queueService = {
  /** Every outreach draft for the current user, newest first. */
  async list(): Promise<OutreachDraft[]> {
    return apiFetch<OutreachDraft[]>("/queue/");
  },

  /** Generate a new draft from a completed analysis (persona + strategy + guardrail). */
  async generate(analysisId: number | string): Promise<OutreachDraft> {
    return apiFetch<OutreachDraft>(`/queue/generate/${analysisId}`, {
      method: "POST",
    });
  },

  async approve(draftId: string): Promise<OutreachDraft> {
    return apiFetch<OutreachDraft>(`/queue/${draftId}/approve`, {
      method: "POST",
    });
  },

  async reject(draftId: string): Promise<OutreachDraft> {
    return apiFetch<OutreachDraft>(`/queue/${draftId}/reject`, {
      method: "POST",
    });
  },

  async edit(draftId: string, subject: string, body: string): Promise<OutreachDraft> {
    const params = new URLSearchParams({ subject, body });
    return apiFetch<OutreachDraft>(`/queue/${draftId}/edit?${params.toString()}`, {
      method: "POST",
    });
  },
};