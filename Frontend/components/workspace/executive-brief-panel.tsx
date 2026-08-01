"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Search,
  Pencil,
  Trash2,
  Check,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreRing } from "@/components/common/score-ring";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MOCK_COMPANIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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

interface Session {
  id: string;
  title: string;
  companyId: string;
  updatedAt: string;
}

const SESSION_SEEDS = [
  "Initial account research",
  "Stakeholder deep dive",
  "Q3 renewal strategy",
  "Competitive positioning",
  "Follow-up outreach draft",
];

function buildMockSessions(): Session[] {
  const sessions: Session[] = [];
  MOCK_COMPANIES.forEach((company, ci) => {
    const count = (ci % 3) + 1;
    for (let i = 0; i < count; i++) {
      sessions.push({
        id: `${company.id}-session-${i}`,
        title: `${company.name} — ${SESSION_SEEDS[(ci + i) % SESSION_SEEDS.length]}`,
        companyId: company.id,
        updatedAt: `${i === 0 ? "Today" : i === 1 ? "Yesterday" : "3d ago"}`,
      });
    }
  });
  return sessions;
}

export function HistorySidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [sessions, setSessions] = useState<Session[]>(buildMockSessions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? sessions.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            MOCK_COMPANIES.find((c) => c.id === s.companyId)?.name.toLowerCase().includes(q),
        )
      : sessions;

    const map = new Map<string, Session[]>();
    filtered.forEach((s) => {
      const list = map.get(s.companyId) ?? [];
      list.push(s);
      map.set(s.companyId, list);
    });
    return MOCK_COMPANIES.filter((c) => map.has(c.id)).map((c) => ({
      company: c,
      sessions: map.get(c.id) ?? [],
    }));
  }, [sessions, query]);

  function startRename(session: Session) {
    setEditingId(session.id);
    setEditingTitle(session.title);
  }

  function commitRename() {
    if (!editingId) return;
    setSessions((prev) => prev.map((s) => (s.id === editingId ? { ...s, title: editingTitle || s.title } : s)));
    setEditingId(null);
  }

  function deleteSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  if (collapsed) {
    return (
      <Card className="flex h-full flex-col items-center gap-3 py-4">
        <button
          onClick={() => setCollapsed(false)}
          className="rounded-lg p-2 text-white/40 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
          aria-label="Expand chat history"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
        <div className="h-px w-6 bg-white/8" />
        <MessageSquare className="h-4 w-4 text-white/25" />
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle>Chats</CardTitle>
        <div className="flex items-center gap-1">
          <button
            className="rounded-lg p-1.5 text-white/35 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
            aria-label="New chat"
            title="New chat"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="rounded-lg p-1.5 text-white/35 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
            aria-label="Collapse sidebar"
            title="Collapse"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardHeader>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full rounded-lg border border-white/8 bg-white/[0.02] py-1.5 pl-8 pr-2 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-white/20 transition-colors"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 pb-4">
        <div className="space-y-1 px-2">
          {grouped.length === 0 && (
            <p className="px-2 py-4 text-center text-[11px] text-white/25">No chats match &ldquo;{query}&rdquo;</p>
          )}
          {grouped.map(({ company, sessions: companySessions }) => {
            const isGroupCollapsed = collapsedGroups[company.id];
            return (
              <div key={company.id} className="mb-1">
                <button
                  onClick={() =>
                    setCollapsedGroups((prev) => ({ ...prev, [company.id]: !prev[company.id] }))
                  }
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.06] text-[9px] font-medium text-white/60">
                    {company.logoInitial}
                  </span>
                  <span className="flex-1 truncate text-[11px] font-medium uppercase tracking-wide text-white/40">
                    {company.name}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 text-white/20 transition-transform",
                      isGroupCollapsed && "-rotate-90",
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {!isGroupCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {companySessions.map((session) => (
                        <div
                          key={session.id}
                          className={cn(
                            "group relative ml-2 flex items-center gap-2 rounded-lg px-2 py-2 text-xs transition-colors",
                            activeId === session.id
                              ? "bg-white/[0.07] text-white/90"
                              : "text-white/45 hover:bg-white/[0.04] hover:text-white/80",
                          )}
                        >
                          {editingId === session.id ? (
                            <>
                              <input
                                autoFocus
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitRename();
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                                className="min-w-0 flex-1 rounded border border-white/15 bg-white/[0.04] px-1.5 py-0.5 text-xs text-white outline-none"
                              />
                              <button onClick={commitRename} className="text-emerald-400 hover:text-emerald-300">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="text-white/30 hover:text-white/60">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setActiveId(session.id)}
                                className="min-w-0 flex-1 truncate text-left"
                                title={session.title}
                              >
                                {session.title}
                              </button>
                              <span className="shrink-0 text-[10px] text-white/20 group-hover:hidden">
                                {session.updatedAt}
                              </span>
                              <div className="hidden shrink-0 items-center gap-1 group-hover:flex">
                                <button
                                  onClick={() => startRename(session)}
                                  className="rounded p-1 text-white/35 hover:bg-white/[0.08] hover:text-white/80"
                                  aria-label="Rename chat"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => deleteSession(session.id)}
                                  className="rounded p-1 text-white/35 hover:bg-red-500/15 hover:text-red-400"
                                  aria-label="Delete chat"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
