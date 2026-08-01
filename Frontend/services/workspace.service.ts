import { apiFetch } from "./api-client";

export interface KnowledgeData {
  company?: string;
  website?: string;
  industry?: string;
  decision_makers?: string[];
  [key: string]: unknown;
}

export interface TimelineEntry {
  step: number;
  agent: string;
  status: string;
  duration_ms: number;
}

export interface OverallAssessment {
  company: string;
  decision_maker: string;
  intent_score: number;
  buying_stage: string;
  priority: string;
  risk_level: string;
  approved: boolean;
  next_action: string;
  overall_recommendation: string;
}

export interface ExecutionMetrics {
  total_time_ms: number;
  agents_executed: number;
  knowledge_saved: boolean;
}

export interface AnalyzeResponse {
  analysis_id: number;
  overall_assessment: OverallAssessment;
  knowledge_id: number;
  knowledge: KnowledgeData;
  persona: Record<string, unknown>;
  intent: Record<string, unknown>;
  strategy: Record<string, unknown>;
  guardrail: Record<string, unknown>;
  timeline: TimelineEntry[];
  execution: ExecutionMetrics;
}

export interface WorkspaceCompanySummary {
  company_id: number;
  company: string;
  website: string;
  industry: string;
  total_analyses: number;
  last_analysis: string;
  latest_intent: number;
  priority: string;
}

export const workspaceService = {
  /**
   * Runs the full multi-agent pipeline (ingestion -> persona -> intent ->
   * strategy -> guardrail) against free-form text and returns the
   * executive summary + full agent outputs.
   */
  async analyze(text: string): Promise<AnalyzeResponse> {
    return apiFetch<AnalyzeResponse>(
      `/assistant/analyze?text=${encodeURIComponent(text)}`,
      { method: "POST" },
    );
  },

  /** Every company the current user has run an analysis against. */
  async listCompanies(): Promise<WorkspaceCompanySummary[]> {
    return apiFetch<WorkspaceCompanySummary[]>("/workspace/");
  },
};