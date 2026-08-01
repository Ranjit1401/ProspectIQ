"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/workspace/chat-panel";
import { AgentProgress } from "@/components/workspace/agent-progress";
import { ExecutiveBriefPanel, HistorySidebar } from "@/components/workspace/executive-brief-panel";
import { workspaceService, type AnalyzeResponse } from "@/services/workspace.service";
import { ApiError } from "@/services/api-client";
import type { ChatMessage } from "@/types";

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

  async function handleSend(text: string) {
    const userMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setSending(true);

    try {
      // The Supervisor plans the task and routes it to whichever agent
      // fits: the sales-analysis pipeline for company briefs/notes, or
      // the research agent for general questions. The frontend no
      // longer decides which endpoint to call — the backend does.
      const response = await workspaceService.runSupervisor(text);

      let replyContent: string;

      if (response.agent === "sales_analysis") {
        const analysis = response.result.response as AnalyzeResponse;
        setResult(analysis);
        replyContent =
          analysis.overall_assessment?.overall_recommendation ||
          "Analysis complete — see the executive brief and agent progress panels for the full breakdown.";
      } else {
        // Research agent — don't touch the executive brief/timeline
        // panels, this wasn't a company analysis.
        const researchResponse = response.result.response as { content?: string };
        replyContent =
          researchResponse?.content ||
          (typeof response.result.response === "string" ? response.result.response : null) ||
          "Here's what I found.";
      }

      const reply: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        role: "assistant",
        content: replyContent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? `The pipeline returned an error: ${err.message}`
          : "Could not reach the backend. Make sure the FastAPI server is running.";

      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now() + 1}`,
          role: "assistant",
          content: message,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-5 lg:grid-cols-[240px_1fr_320px]">
      <div className="hidden lg:block">
        <HistorySidebar />
      </div>

      <div className="min-h-0">
        <ChatPanel messages={messages} onSend={handleSend} sending={sending} />
      </div>

      <div className="space-y-5 overflow-y-auto pr-1">
        <ExecutiveBriefPanel
          assessment={result?.overall_assessment ?? null}
          knowledge={result?.knowledge ?? null}
        />
        <AgentProgress timeline={result?.timeline ?? []} running={sending} />
      </div>
    </div>
  );
}