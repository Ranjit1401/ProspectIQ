"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreRing } from "@/components/common/score-ring";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MOCK_COMPANIES } from "@/lib/mock-data";

export function ExecutiveBriefPanel() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Executive Brief — Anthropic</CardTitle>
        <ScoreRing score={94} size={54} label="" />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[13px] leading-relaxed text-white/50">
          Engineering leadership has publicly flagged fragmented tooling as a
          platform-strategy blocker, and FY26 infra budget has been approved.
          Recommended motion: lead with a platform-consolidation angle to the CTO.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="danger">Critical pain point</Badge>
          <Badge variant="success">Budget approved</Badge>
          <Badge variant="outline">4 stakeholders</Badge>
        </div>
        <Link
          href="/accounts/anthropic"
          className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors"
        >
          View full report <ArrowUpRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function HistorySidebar() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Recent Sessions</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-1 px-2 pb-4">
        <div className="space-y-1 px-3">
          {MOCK_COMPANIES.map((company) => (
            <Link
              key={company.id}
              href={`/accounts/${company.id}`}
              className="flex items-center justify-between rounded-lg px-2 py-2 text-xs text-white/45 hover:bg-white/[0.04] hover:text-white/80 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.06] text-[10px] text-white/60">
                  {company.logoInitial}
                </span>
                {company.name}
              </span>
              <span className="text-[10px] text-white/25">{company.score}</span>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
