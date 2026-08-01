"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Check, Loader2, ShieldAlert, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ChatMessage, AgentProgressStep } from "@/types";
import { MOCK_CHAT } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const RUN_STEPS: Omit<AgentProgressStep, "status">[] = [
  { id: "ingest", label: "Ingesting sources", detail: "147 pages · 3 documents" },
  { id: "research", label: "Research agent", detail: "12,400 tokens extracted" },
  { id: "stakeholder", label: "Mapping stakeholders", detail: "4 stakeholders identified" },
  { id: "pain_point", label: "Detecting pain points", detail: "Cross-referencing evidence" },
  { id: "buying_signal", label: "Detecting buying signals", detail: "3 signals found" },
  { id: "strategy", label: "Generating strategy", detail: "Drafting recommended motion" },
  { id: "guardrail", label: "Running guardrail check", detail: "0 violations" },
  { id: "confidence", label: "Scoring confidence", detail: "94% grounded" },
  { id: "approval", label: "Awaiting human approval", detail: "Queued for review" },
];

const FINAL_REPLY =
  "Analysis complete. Engineering leadership has publicly flagged fragmented tooling as a platform-strategy blocker, and FY26 infra budget has been approved. I've mapped 4 stakeholders, surfaced 2 critical pain points, and drafted a platform-consolidation angle for the CTO. Full breakdown is in the Executive Report below, and everything I pulled from is listed under Resources Used.";

interface RunState {
  messageId: string;
  steps: (AgentProgressStep & { status: AgentProgressStep["status"] })[];
  done: boolean;
}

export function ChatPanel({
  onSend,
  onAnalysisComplete,
}: {
  onSend?: (text: string) => void;
  onAnalysisComplete?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT);
  const [draft, setDraft] = useState("");
  const [run, setRun] = useState<RunState | null>(null);
  const [streamedText, setStreamedText] = useState<Record<string, string>>({});
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, run, streamedText]);

  function handleSend() {
    if (!draft.trim()) return;
    const text = draft;
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    const assistantId = `m-${Date.now() + 1}`;
    setMessages((prev) => [...prev, userMsg]);
    onSend?.(text);
    setDraft("");

    const steps = RUN_STEPS.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" }) as AgentProgressStep);
    setRun({ messageId: assistantId, steps, done: false });

    // Sequentially "execute" each agent step, Claude-style.
    RUN_STEPS.forEach((_, i) => {
      window.setTimeout(
        () => {
          setRun((prev) => {
            if (!prev) return prev;
            const next = prev.steps.map((s, idx) => {
              if (idx < i) return { ...s, status: "done" as const };
              if (idx === i) return { ...s, status: "active" as const };
              return { ...s, status: "pending" as const };
            });
            return { ...prev, steps: next };
          });
        },
        380 + i * 480,
      );
    });

    const totalDuration = 380 + RUN_STEPS.length * 480;
    window.setTimeout(() => {
      setRun((prev) => (prev ? { ...prev, steps: prev.steps.map((s) => ({ ...s, status: "done" as const })), done: true } : prev));
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: FINAL_REPLY, timestamp: new Date().toISOString() },
      ]);
      streamText(assistantId, FINAL_REPLY, () => onAnalysisComplete?.());
    }, totalDuration + 250);
  }

  function streamText(id: string, full: string, onDone?: () => void) {
    let i = 0;
    setStreamedText((prev) => ({ ...prev, [id]: "" }));
    const interval = window.setInterval(() => {
      i += 3;
      setStreamedText((prev) => ({ ...prev, [id]: full.slice(0, i) }));
      if (i >= full.length) {
        window.clearInterval(interval);
        onDone?.();
      }
    }, 18);
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/8 bg-[#111111]">
      <div className="flex items-center gap-2 border-b border-white/6 px-4 py-3.5">
        <Sparkles className="h-4 w-4 text-white/50" />
        <span className="text-sm font-medium text-white/85">Research Assistant</span>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-5">
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const isLiveAssistant = run?.messageId === message.id;
              const streamed = streamedText[message.id];
              const shown = streamed !== undefined ? streamed : message.content;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-3", message.role === "user" && "flex-row-reverse")}
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback>{message.role === "user" ? "AK" : "IQ"}</AvatarFallback>
                  </Avatar>
                  <div className={cn("flex max-w-[85%] flex-col gap-2", message.role === "user" && "items-end")}>
                    {isLiveAssistant && run && (
                      <AgentRunTrace steps={run.steps} />
                    )}
                    {(message.role !== "assistant" || !isLiveAssistant || run?.done) && (
                      <div
                        className={cn(
                          "rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                          message.role === "user"
                            ? "bg-white/[0.08] text-white/90"
                            : "bg-white/[0.03] border border-white/6 text-white/65",
                        )}
                      >
                        {shown}
                        {streamed !== undefined && streamed.length < message.content.length && (
                          <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-white/40 align-middle" />
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={scrollAnchorRef} />
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2 border-t border-white/6 p-3">
        <Input
          placeholder="Ask ProspectIQ to research an account..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button size="icon" onClick={handleSend} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function AgentRunTrace({ steps }: { steps: AgentProgressStep[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const allDone = steps.every((s) => s.status === "done");

  useEffect(() => {
    if (allDone) {
      const t = window.setTimeout(() => setCollapsed(true), 600);
      return () => window.clearTimeout(t);
    }
  }, [allDone]);

  return (
    <div className="w-full rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-[12px] font-medium text-white/70">
          {allDone ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-white/50" />
          )}
          {allDone ? "Agent run complete" : "Agent working..."}
          <span className="text-white/30 font-normal">
            ({steps.filter((s) => s.status === "done").length}/{steps.length})
          </span>
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-white/30 transition-transform", !collapsed && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="space-y-2.5 border-t border-white/6 px-3.5 py-3">
              {steps.map((step) => (
                <div key={step.id} className="flex items-start gap-2.5">
                  <div
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      step.status === "done" && "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
                      step.status === "active" && "border-white/30 bg-white/10 text-white",
                      step.status === "pending" && "border-white/10 text-white/20",
                      step.status === "blocked" && "border-amber-500/40 bg-amber-500/15 text-amber-400",
                    )}
                  >
                    {step.status === "done" && <Check className="h-2.5 w-2.5" />}
                    {step.status === "active" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                    {step.status === "blocked" && <ShieldAlert className="h-2.5 w-2.5" />}
                    {step.status === "pending" && <span className="h-1 w-1 rounded-full bg-current" />}
                  </div>
                  <div>
                    <p className={cn("text-[12px]", step.status === "pending" ? "text-white/30" : "text-white/80")}>
                      {step.label}
                    </p>
                    {step.detail && step.status !== "pending" && (
                      <p className="text-[10.5px] text-white/35">{step.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
