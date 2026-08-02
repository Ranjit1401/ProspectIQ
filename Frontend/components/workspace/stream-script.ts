import type { ComposerAttachment, WorkspaceMode } from "@/components/workspace/prompt-composer";

export interface ScriptedStep {
  label: string;
  chip?: string;
}

const CHIP_BY_KIND: Record<ComposerAttachment["kind"], string> = {
  pdf: "PDF",
  csv: "CSV",
  url: "Website",
  crm: "CRM",
  image: "Image",
  notes: "Notes",
  audio: "Audio",
  video: "Video",
};

function attachmentStep(a: ComposerAttachment): ScriptedStep {
  switch (a.kind) {
    case "pdf":
      return { label: `Reading ${a.label}...`, chip: CHIP_BY_KIND.pdf };
    case "csv":
      return { label: `Parsing ${a.label}...`, chip: CHIP_BY_KIND.csv };
    case "url":
      return { label: `Reading ${a.label}...`, chip: CHIP_BY_KIND.url };
    case "crm":
      return { label: "Connecting CRM...", chip: CHIP_BY_KIND.crm };
    case "image":
      return { label: `Analyzing ${a.label}...`, chip: CHIP_BY_KIND.image };
    case "notes":
      return { label: `Reading ${a.label}...`, chip: CHIP_BY_KIND.notes };
    case "audio":
      return { label: `Transcribing ${a.label}...`, chip: CHIP_BY_KIND.audio };
    case "video":
      return { label: `Processing ${a.label}...`, chip: CHIP_BY_KIND.video };
  }
}

const CORE_STEPS: Record<WorkspaceMode, string[]> = {
  "Deep Research": [
    "Extracting company knowledge...",
    "Finding stakeholders...",
    "Finding pain points...",
    "Finding buying signals...",
    "Running LLM council...",
    "Calculating confidence...",
    "Generating executive report...",
  ],
  "Executive Brief": [
    "Extracting company knowledge...",
    "Synthesizing key findings...",
    "Scoring intent & priority...",
    "Drafting executive brief...",
  ],
  "Competitive Analysis": [
    "Extracting company knowledge...",
    "Comparing market positioning...",
    "Identifying differentiators...",
    "Scoring competitive risk...",
    "Drafting competitive analysis...",
  ],
  "Outreach Strategy": [
    "Extracting company knowledge...",
    "Finding stakeholders...",
    "Matching messaging angles...",
    "Drafting outreach strategy...",
  ],
  "Quick Analysis": ["Reading your message...", "Analyzing intent...", "Preparing a quick summary..."],
};

/**
 * Builds the ordered list of lines shown while a research request streams
 * in. Attachment/connection steps only appear when the person actually
 * chose them in the composer, so nothing implies a data source is wired
 * up unless it genuinely was.
 */
export function buildStreamScript(mode: WorkspaceMode, attachments: ComposerAttachment[]): ScriptedStep[] {
  const attachmentSteps = attachments.map(attachmentStep);
  const coreSteps = (CORE_STEPS[mode] ?? CORE_STEPS["Quick Analysis"]).map((label) => ({ label }));
  return [...attachmentSteps, ...coreSteps];
}
