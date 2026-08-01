"use client";

import { motion } from "framer-motion";
import { Database, Globe, Mail, Users, FileText, Newspaper, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ResourceSource {
  id: string;
  label: string;
  icon: LucideIcon;
  count: number;
  detail: string;
}

const SOURCES: ResourceSource[] = [
  { id: "crm", label: "CRM", icon: Database, count: 3, detail: "Salesforce records" },
  { id: "website", label: "Website", icon: Globe, count: 18, detail: "Pages crawled" },
  { id: "emails", label: "Emails", icon: Mail, count: 7, detail: "Threads reviewed" },
  { id: "meetings", label: "Meeting Notes", icon: Users, count: 4, detail: "Call transcripts" },
  { id: "pdfs", label: "PDFs", icon: FileText, count: 5, detail: "Docs & filings" },
  { id: "news", label: "News", icon: Newspaper, count: 12, detail: "Articles scanned" },
];

export function ResourcesPanel({ active = false }: { active?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resources Used</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2.5">
        {SOURCES.map((source, i) => (
          <motion.div
            key={source.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "flex flex-col gap-2 rounded-xl border border-white/6 bg-white/[0.02] p-3 transition-colors",
              active && "border-white/12 bg-white/[0.035]",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg border border-white/8 bg-white/[0.04] p-1.5 text-white/60">
                <source.icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold text-white/85 tabular-nums">{active ? source.count : "—"}</span>
            </div>
            <div>
              <p className="text-[12px] font-medium text-white/75">{source.label}</p>
              <p className="text-[10.5px] text-white/35">{source.detail}</p>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
