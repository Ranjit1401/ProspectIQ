"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/types";
import { MOCK_CHAT } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function ChatPanel({ onSend }: { onSend?: (text: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT);
  const [draft, setDraft] = useState("");

  function handleSend() {
    if (!draft.trim()) return;
    const next: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: draft,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, next]);
    onSend?.(draft);
    setDraft("");

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now() + 1}`,
          role: "assistant",
          content:
            "Starting the pipeline — ingesting sources, then mapping stakeholders and checking every claim against evidence before anything reaches the approval queue.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }, 700);
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
                  <AvatarFallback>{message.role === "user" ? "AK" : "IQ"}</AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
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
