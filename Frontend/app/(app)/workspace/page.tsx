"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/workspace/chat-panel";
import { ResourcesPanel } from "@/components/workspace/resources-panel";
import { ExecutiveReport } from "@/components/workspace/executive-report";
import { HistorySidebar } from "@/components/workspace/executive-brief-panel";

export default function WorkspacePage() {
  const [analysisComplete, setAnalysisComplete] = useState(false);

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-5 lg:grid-cols-[auto_1fr_340px]">
      <div className="hidden lg:block lg:w-[240px]">
        <HistorySidebar />
      </div>

      <div className="min-h-0">
        <ChatPanel onAnalysisComplete={() => setAnalysisComplete(true)} />
      </div>

      <div className="space-y-5 overflow-y-auto pr-1">
        <ResourcesPanel active={analysisComplete} />
        {analysisComplete && <ExecutiveReport companyId="anthropic" />}
      </div>
    </div>
  );
}
