"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
<<<<<<< HEAD
import { Sparkles } from "lucide-react";
=======
import { Send, Sparkles, Loader2 } from "lucide-react";
>>>>>>> eb4a03798b9e26785d9c9831085d17640cba910d
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PromptComposer, type ComposerAttachment, type WorkspaceMode } from "@/components/workspace/prompt-composer";
import { ResearchLoader } from "@/components/workspace/research-loader";
import { StreamSteps } from "@/components/workspace/stream-steps";
import { ReportReadyCard } from "@/components/workspace/report-ready-card";
import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  messages: ChatMessage[];
<<<<<<< HEAD
  onSend: (text: string, meta: { mode: WorkspaceMode; attachments: ComposerAttachment[] }) => void | Promise<void>;
  sending?: boolean;
}

export function ChatPanel({ messages, onSend, sending }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);
=======
  onSend: (text: string) => void | Promise<void>;
  sending?: boolean;
}

export function ChatPanel({ messages, onSend, sending }: ChatPanelProps) {
  const [draft, setDraft] = useState("");

  function handleSend() {
    if (!draft.trim() || sending) return;
    const text = draft;
    setDraft("");
    void onSend(text);
  }
>>>>>>> eb4a03798b9e26785d9c9831085d17640cba910d

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/8 bg-[#111111]">
      <div className="flex items-center gap-2 border-b border-white/6 px-4 py-3.5">
        <Sparkles className="h-4 w-4 text-white/50" />
        <span className="text-sm font-medium text-white/85">Research Assistant</span>
      </div>

      <ScrollArea className="flex-1 px-4 py-5">
        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-3", message.role === "user" && "flex-row-reverse")}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback>{message.role === "user" ? "You" : "IQ"}</AvatarFallback>
                </Avatar>

                <div
                  className={cn(
<<<<<<< HEAD
                    "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
=======
                    "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
>>>>>>> eb4a03798b9e26785d9c9831085d17640cba910d
                    message.role === "user"
                      ? "bg-white/[0.08] text-white/90"
                      : "border border-white/6 bg-white/[0.03] text-white/70",
                  )}
                >
                  {message.role === "user" ? (
                    <div className="space-y-2">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {message.attachments.map((label) => (
                            <span
                              key={label}
                              className="rounded-full border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/60"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : message.kind === "loading" ? (
                    <ResearchLoader />
                  ) : message.kind === "stream" ? (
                    <StreamSteps steps={message.steps ?? []} chips={message.chips ?? []} />
                  ) : message.kind === "report" ? (
                    <div className="space-y-1">
                      <p className="whitespace-pre-wrap text-white/75">{message.content}</p>
                      {message.report && <ReportReadyCard report={message.report} />}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
<<<<<<< HEAD
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <PromptComposer onSend={onSend} sending={sending} />
=======

          {sending && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback>IQ</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 rounded-2xl border border-white/6 bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white/45">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Running the agent pipeline…
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2 border-t border-white/6 p-3">
        <Input
          placeholder="Paste a company brief, notes, or a website summary to research..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={sending}
        />
        <Button size="icon" onClick={handleSend} aria-label="Send message" disabled={sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
>>>>>>> eb4a03798b9e26785d9c9831085d17640cba910d
    </div>
  );
}