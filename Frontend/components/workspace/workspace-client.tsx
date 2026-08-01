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
    "Send me a company brief, some notes, or a website summary and I'll run it through the research pipeline — knowledge extraction, persona, intent, strategy, and a guardrail check.",
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
      const response = await workspaceService.analyze(text);
      setResult(response);

      const reply: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        role: "assistant",
        content:
          response.overall_assessment?.overall_recommendation ||
          "Analysis complete — see the executive brief and agent progress panels for the full breakdown.",
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