"use client";

import { motion } from "framer-motion";
import { Check, Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentProgressStep } from "@/types";
import { cn } from "@/lib/utils";

const STEPS: AgentProgressStep[] = [
  { id: "ingest", label: "Ingesting sources", status: "done", detail: "147 pages, 3 documents" },
  { id: "research", label: "Research agent", status: "done", detail: "12,400 tokens extracted" },
  { id: "stakeholder", label: "Stakeholder mapping", status: "done", detail: "4 stakeholders identified" },
  { id: "pain_point", label: "Pain point detection", status: "active", detail: "Cross-referencing evidence" },
  { id: "buying_signal", label: "Buying signal detection", status: "pending" },
  { id: "strategy", label: "Strategy generation", status: "pending" },
  { id: "guardrail", label: "Guardrail check", status: "pending" },
  { id: "confidence", label: "Confidence scoring", status: "pending" },
  { id: "approval", label: "Awaiting human approval", status: "pending" },
];

export function AgentProgress() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3"
          >
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                step.status === "done" && "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
                step.status === "active" && "border-white/30 bg-white/10 text-white",
                step.status === "pending" && "border-white/10 text-white/20",
                step.status === "blocked" && "border-amber-500/40 bg-amber-500/15 text-amber-400",
              )}
            >
              {step.status === "done" && <Check className="h-3 w-3" />}
              {step.status === "active" && <Loader2 className="h-3 w-3 animate-spin" />}
              {step.status === "blocked" && <ShieldAlert className="h-3 w-3" />}
              {step.status === "pending" && <span className="h-1 w-1 rounded-full bg-current" />}
            </div>
            <div>
              <p
                className={cn(
                  "text-[13px]",
                  step.status === "pending" ? "text-white/30" : "text-white/85",
                )}
              >
                {step.label}
              </p>
              {step.detail && <p className="text-[11px] text-white/35">{step.detail}</p>}
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
