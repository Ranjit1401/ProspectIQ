"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileCheck2, Eye, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WorkspaceReportCompletion } from "@/types";

interface ReportReadyCardProps {
  report: WorkspaceReportCompletion;
  onPreview?: () => void;
}

/**
 * Completion state shown once the pipeline finishes a company analysis.
 * The report page itself isn't built yet, so "Open Report" and
 * "Download PDF" surface a lightweight inline note rather than pretending
 * to navigate somewhere real.
 */
export function ReportReadyCard({ report, onPreview }: ReportReadyCardProps) {
  const [note, setNote] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  function handlePreview() {
    setPreviewOpen((v) => !v);
    onPreview?.();
  }

  function handleComingSoon(action: string) {
    setNote(`${action} — the full report page is coming soon.`);
    window.setTimeout(() => setNote(null), 2600);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3.5"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
          <FileCheck2 className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-white/90">Executive Report Ready</p>
          {report.company && (
            <p className="truncate text-[11px] text-white/40">{report.company}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={handlePreview} className="gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          {previewOpen ? "Hide preview" : "Preview Report"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleComingSoon("Open Report")} className="gap-1.5">
          <ExternalLink className="h-3.5 w-3.5" />
          Open Report
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleComingSoon("Download PDF")} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Download PDF
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {previewOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 rounded-xl border border-white/6 bg-white/[0.02] p-3">
              {report.recommendation && (
                <p className="text-[12px] leading-relaxed text-white/60">{report.recommendation}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {report.riskLevel && (
                  <Badge variant={report.riskLevel.toLowerCase() === "high" ? "danger" : "outline"}>
                    {report.riskLevel} risk
                  </Badge>
                )}
                {typeof report.approved === "boolean" && (
                  <Badge variant={report.approved ? "success" : "danger"}>
                    {report.approved ? "Approved" : "Needs review"}
                  </Badge>
                )}
                {report.buyingStage && <Badge variant="outline">{report.buyingStage}</Badge>}
              </div>
              {report.nextAction && (
                <p className="text-[11px] text-white/35">
                  Next action: <span className="text-white/65">{report.nextAction}</span>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {note && <p className="mt-2 text-[11px] text-white/35">{note}</p>}
    </motion.div>
  );
}
