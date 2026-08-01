"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  messages: ChatMessage[];
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

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/8 bg-[#111111]">
      <div className="flex items-center gap-2 border-b border-white/6 px-4 py-3.5">
        <Sparkles className="h-4 w-4 text-white/50" />
        <span className="text-sm font-medium text-white/85">Research Assistant</span>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
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
                    "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                    message.role === "user"
                      ? "bg-white/[0.08] text-white/90"
                      : "bg-white/[0.03] border border-white/6 text-white/65",
                  )}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

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
    </div>
  );
}