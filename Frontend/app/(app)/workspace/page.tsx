import { ChatPanel } from "@/components/workspace/chat-panel";
import { AgentProgress } from "@/components/workspace/agent-progress";
import { ExecutiveBriefPanel, HistorySidebar } from "@/components/workspace/executive-brief-panel";

export default function WorkspacePage() {
  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-5 lg:grid-cols-[240px_1fr_320px]">
      <div className="hidden lg:block">
        <HistorySidebar />
      </div>

      <div className="min-h-0">
        <ChatPanel />
      </div>

      <div className="space-y-5 overflow-y-auto pr-1">
        <ExecutiveBriefPanel />
        <AgentProgress />
      </div>
    </div>
  );
}
