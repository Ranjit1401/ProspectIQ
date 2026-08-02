"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/workspace/chat-panel";
import { ExecutiveBriefPanel, HistorySidebar } from "@/components/workspace/executive-brief-panel";
import { buildStreamScript } from "@/components/workspace/stream-script";
import type { ComposerAttachment, WorkspaceMode } from "@/components/workspace/prompt-composer";
import { workspaceService, type AnalyzeResponse } from "@/services/workspace.service";
import { ApiError } from "@/services/api-client";
import type { ChatMessage, WorkspaceStreamStep } from "@/types";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Send me a company brief, some notes, or a website summary and I'll run it through the research pipeline — knowledge extraction, persona, intent, strategy, and a guardrail check. Ask me a general question instead and I'll just answer it directly.",
  timestamp: new Date().toISOString(),
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

    // The Supervisor plans the task and routes it to whichever agent fits:
    // the sales-analysis pipeline for company briefs/notes, or the
    // research agent for general questions. This call is unchanged — it
    // just now runs alongside the visual stream instead of blocking it.
    const apiPromise = workspaceService
      .runSupervisor(text)
      .then((response) => ({ ok: true as const, response }))
      .catch((err: unknown) => ({ ok: false as const, err }));

    // Brief loader before the step-by-step trail takes over.
    await sleep(650);

    const script = buildStreamScript(meta.mode, meta.attachments);
    const steps: WorkspaceStreamStep[] = [];
    const chips: string[] = [];

    patchMessage(assistantId, { kind: "stream", steps: [], chips: [] });

    for (let i = 0; i < script.length; i++) {
      const scripted = script[i];
      steps.push({ id: `${assistantId}-s${i}`, label: scripted.label, status: "active" });
      patchMessage(assistantId, { steps: [...steps] });

      await sleep(420 + Math.random() * 260);

      steps[steps.length - 1] = { ...steps[steps.length - 1], status: "done" };
      if (scripted.chip && !chips.includes(scripted.chip)) chips.push(scripted.chip);
      patchMessage(assistantId, { steps: [...steps], chips: [...chips] });
    }

    const outcome = await apiPromise;

    if (!outcome.ok) {
      const message =
        outcome.err instanceof ApiError
          ? `The pipeline returned an error: ${outcome.err.message}`
          : "Could not reach the backend. Make sure the FastAPI server is running.";

      patchMessage(assistantId, {
        kind: "text",
        content: message,
        steps: undefined,
        chips: undefined,
      });
      setSending(false);
      return;
    }

    const { response } = outcome;

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

    setSending(false);
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