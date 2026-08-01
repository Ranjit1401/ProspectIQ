export type ResearchStatus = "analyzed" | "in-review" | "queued";

export interface Company {
  id: string;
  name: string;
  industry: string;
  employees: string;
  revenue: string;
  score: number;
  status: ResearchStatus;
  country: string;
  logoInitial?: string;
}

export type StakeholderInfluence =
  | "Decision Maker"
  | "Champion"
  | "Budget Holder"
  | "Influencer"
  | "Blocker";

export interface Stakeholder {
  id: string;
  name: string;
  title: string;
  dept: string;
  influence: StakeholderInfluence;
  score: number;
  linkedin: boolean;
  email: string;
  companyId: string;
  evidence?: string[];
  painPoints?: string[];
  buyingSignals?: string[];
}

export type Severity = "critical" | "high" | "medium" | "low";

export interface PainPoint {
  id: string;
  title: string;
  severity: Severity;
  confidence: number;
  sources: number;
  excerpt: string;
  companyId?: string;
}

export interface BuyingSignal {
  id: string;
  title: string;
  strength: "strong" | "moderate" | "weak";
  detectedAt: string;
  source: string;
}

export type AuditAgent =
  | "Orchestrator"
  | "WebCrawler"
  | "PeopleIntel"
  | "ReasonEngine"
  | "StrategyAI"
  | "GuardrailAgent"
  | "QueueManager"
  | "IntentAgent"
  | "PersonaAgent";

export interface AuditEvent {
  id: string;
  event: string;
  agent: AuditAgent;
  time: string;
  timestamp: string;
  detail: string;
  status: "success" | "warning" | "info";
}

export type AgentStage =
  | "ingest"
  | "research"
  | "stakeholder"
  | "pain_point"
  | "buying_signal"
  | "strategy"
  | "guardrail"
  | "confidence"
  | "approval";

export interface AgentProgressStep {
  id: AgentStage;
  label: string;
  status: "pending" | "active" | "done" | "blocked";
  detail?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface OutreachDraft {
  id: string;
  companyId: string;
  companyName: string;
  stakeholderName: string;
  channel: "email" | "linkedin" | "call-script";
  subject: string;
  body: string;
  confidence: number;
  reasoning: string;
  evidence: string[];
  status: "pending" | "approved" | "rejected" | "edited";
  createdAt: string;
}

export interface RelationshipNode {
  id: string;
  name: string;
  title: string;
  influence: StakeholderInfluence;
  confidence: number;
  evidence: string[];
  painPoints: string[];
  buyingSignals: string[];
  x?: number;
  y?: number;
}

export interface RelationshipEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface TrustDistributionPoint {
  bucket: string;
  count: number;
}

export interface ResearchActivityPoint {
  date: string;
  analyses: number;
}

export interface PainPointsByIndustryPoint {
  industry: string;
  count: number;
}

export interface ResearchStatusSlice {
  status: ResearchStatus;
  count: number;
}

export type NavKey =
  | "workspace"
  | "accounts"
  | "report"
  | "graph"
  | "queue"
  | "audit"
  | "profile";
