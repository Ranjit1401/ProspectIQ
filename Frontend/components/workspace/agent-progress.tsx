"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimelineEntry } from "@/services/workspace.service";
import { cn } from "@/lib/utils";

interface AgentProgressProps {
  timeline: TimelineEntry[];
  running?: boolean;
}

export function AgentProgress({ timeline, running }: AgentProgressProps) {
  if (timeline.length === 0 && !running) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[13px] text-white/35">
            Send a message in the chat to kick off the research pipeline — steps will appear here as
            each agent runs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {timeline.map((step, i) => (
          <motion.div
            key={`${step.step}-${step.agent}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3"
          >
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-400">
              <Check className="h-3 w-3" />
            </div>
            <div>
              <p className="text-[13px] text-white/85">{step.agent}</p>
              <p className="text-[11px] text-white/35">
                {step.status} · {step.duration_ms} ms
              </p>
            </div>
          </motion.div>
        ))}

        {running && (
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white",
              )}
            >
              <Loader2 className="h-3 w-3 animate-spin" />
            </div>
            <div>
              <p className="text-[13px] text-white/85">Running pipeline…</p>
              <p className="text-[11px] text-white/35">Waiting on the agents to finish</p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}