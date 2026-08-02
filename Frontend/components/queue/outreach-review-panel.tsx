"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronLeft, ChevronRight, Loader2, Mail, Linkedin, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScoreRing } from "@/components/common/score-ring";
import { OutreachTimeline } from "@/components/queue/outreach-timeline";
import type { OutreachDraft } from "@/types";

const CHANNEL_ICON = { email: Mail, linkedin: Linkedin, "call-script": Phone };

export function OutreachReviewPanel({
  draft,
  index,
  total,
  onPrev,
  onNext,
  onApprove,
  onReject,
}: {
  draft: OutreachDraft;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const ChannelIcon = CHANNEL_ICON[draft.channel];

  async function handleApprove() {
    setPendingAction("approve");
    try {
      await onApprove(draft.id);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleReject() {
    setPendingAction("reject");
    try {
      await onReject(draft.id);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-medium text-white/90">
            {draft.companyName} · {draft.stakeholderName}
          </h3>
          <p className="text-xs text-white/40">{draft.subject}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPrev} disabled={total <= 1}>
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </Button>
          <span className="px-1 text-xs text-white/30">
            {index + 1} / {total}
          </span>
          <Button variant="outline" size="sm" onClick={onNext} disabled={total <= 1}>
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={draft.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]"
        >
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between border-b border-white/6 px-5 py-3">
                <div className="flex items-center gap-2 text-[11px] text-white/40">
                  <ChannelIcon className="h-3.5 w-3.5" /> {draft.channel}
                </div>
                <Badge variant={draft.status === "approved" ? "success" : draft.status === "rejected" ? "danger" : draft.status === "edited" ? "outline" : "warning"}>
                  {draft.status}
                </Badge>
              </div>
              <div className="space-y-3 p-5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30">Subject</p>
                  <p className="mt-1 text-[13px] font-medium text-white/85">{draft.subject}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30">Message</p>
                  <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-white/55">
                    {draft.body}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="space-y-3 p-5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30">Why this draft (Reasoning)</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">
                    {draft.reasoning || "No reasoning recorded for this draft."}
                  </p>
                </div>

                {draft.evidence.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-1.5 text-[10px] uppercase tracking-wider text-white/30">Supporting Evidence</p>
                      <div className="flex flex-wrap gap-1.5">
                        {draft.evidence.map((e) => (
                          <span
                            key={e}
                            className="rounded-full border border-white/8 bg-white/[0.02] px-2.5 py-1 text-[11px] text-white/40"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {draft.status === "pending" || draft.status === "edited" ? (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleReject} disabled={pendingAction !== null}>
                  {pendingAction === "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  Reject
                </Button>
                <Button onClick={handleApprove} disabled={pendingAction !== null}>
                  {pendingAction === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Approve
                </Button>
              </div>
            ) : (
              <p className="text-right text-[11px] text-white/25">
                {draft.status === "approved" ? "Approved — ready for manual send" : "Rejected"}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <div className="flex flex-col items-center gap-2 p-5">
                <ScoreRing score={draft.confidence} size={84} label="confidence" />
                <p className="text-center text-[11px] text-white/30">
                  Based on Guardrail-verified claims from this account&apos;s analysis
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-5">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-white/30">Outreach Workflow</p>
                <OutreachTimeline draft={draft} />
              </div>
            </Card>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
