"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/workspace/chat-panel";
import { ExecutiveBriefPanel, HistorySidebar } from "@/components/workspace/executive-brief-panel";
import type { ComposerAttachment, WorkspaceMode } from "@/components/workspace/prompt-composer";
import {
  workspaceService,
  type AnalyzeResponse,
  type WorkspaceLiveStep,
} from "@/services/workspace.service";
import type { ChatMessage, WorkspaceStreamStep } from "@/types";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Send me a company brief, some notes, or a website summary and I'll run it through the research pipeline — knowledge extraction, persona, intent, strategy, and a guardrail check. Ask me a general question instead and I'll just answer it directly.",
  timestamp: new Date().toISOString(),
};

export function WorkspaceClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null);

  function patchMessage(id: string, patch: Partial<ChatMessage>) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  async function handleSend(
    text: string,
    meta: { mode: WorkspaceMode; attachments: ComposerAttachment[] },
  ) {
    const userMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
      attachments: meta.attachments.map((a) => a.label),
    };
    const assistantId = `m-${Date.now() + 1}`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      kind: "loading",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setSending(true);
    patchMessage(assistantId, { kind: "stream", steps: [], chips: [] });

    // Live trail of whatever the backend agents are actually doing right
    // now — the Supervisor plans the task, the Router picks an agent
    // (sales-analysis pipeline for company briefs/notes, or the research
    // agent for general questions), and each agent along the way reports
    // its own progress as it runs. Every label below comes straight from
    // the backend event, nothing here is scripted on the frontend.
    const steps: WorkspaceStreamStep[] = [];
    const chips: string[] = [];

    function handleLiveStep(step: WorkspaceLiveStep) {
      const existingIndex = steps.findIndex((s) => s.id === step.id);
      const uiStep: WorkspaceStreamStep = {
        id: step.id,
        label: step.label,
        status: step.status === "active" ? "active" : "done",
      };

      if (existingIndex === -1) {
        steps.push(uiStep);
      } else {
        steps[existingIndex] = uiStep;
      }

      // Once an agent finishes its step, surface its real name as a
      // chip — this reflects which agents genuinely ran, not a fixed
      // per-mode list.
      if (step.status === "done" && step.agent && !chips.includes(step.agent)) {
        chips.push(step.agent);
      }

      patchMessage(assistantId, { steps: [...steps], chips: [...chips] });
    }

    try {
      const response = await workspaceService.streamSupervisor(text, handleLiveStep);

      if (response.agent === "sales_analysis") {
        const analysis = response.result.response as AnalyzeResponse;
        setResult(analysis);
        const assessment = analysis.overall_assessment;
        const replyContent =
          assessment?.overall_recommendation ||
          "Analysis complete — see the executive brief for the full breakdown.";

        patchMessage(assistantId, {
          kind: "report",
          content: replyContent,
          steps: undefined,
          chips: undefined,
          report: {
            company: assessment?.company || analysis.knowledge?.company,
            recommendation: assessment?.overall_recommendation,
            riskLevel: assessment?.risk_level,
            buyingStage: assessment?.buying_stage,
            nextAction: assessment?.next_action,
            approved: assessment?.approved,
          },
        });
      } else {
        // Research agent — don't touch the executive brief panel, this
        // wasn't a company analysis.
        const researchResponse = response.result.response as { content?: string };
        const replyContent =
          researchResponse?.content ||
          (typeof response.result.response === "string" ? response.result.response : null) ||
          "Here's what I found.";

        patchMessage(assistantId, {
          kind: "text",
          content: replyContent,
          steps: undefined,
          chips: undefined,
        });
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? `The pipeline returned an error: ${err.message}`
          : "Could not reach the backend. Make sure the FastAPI server is running.";

      patchMessage(assistantId, {
        kind: "text",
        content: message,
        steps: undefined,
        chips: undefined,
      });
    } finally {
      setSending(false);
    }
  }

  async function handleHistorySelect(id: number) {
    try {
      const analysis = await workspaceService.getAnalysis(id);
      setResult(analysis);
      setSelectedAnalysisId(id);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-5 lg:grid-cols-[240px_1fr_300px]">
      <div className="hidden lg:block">
        <HistorySidebar onSelect={handleHistorySelect} />
      </div>

      <div className="min-h-0">
        <ChatPanel messages={messages} onSend={handleSend} sending={sending} />
      </div>

      <div className="hidden overflow-y-auto pr-1 lg:block">
        <ExecutiveBriefPanel assessment={result?.overall_assessment ?? null} knowledge={result?.knowledge ?? null} />
      </div>
    </div>
  );
}