"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { OutreachCard } from "@/components/queue/outreach-card";
import { queueService } from "@/services/queue.service";
import { ApiError } from "@/services/api-client";
import type { OutreachDraft } from "@/types";

export default function QueuePage() {
  const [drafts, setDrafts] = useState<OutreachDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    queueService
      .list()
      .then((data) => {
        if (!cancelled) setDrafts(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message || "Could not load the outreach queue."
              : "Could not reach the backend. Make sure the FastAPI server is running.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleApprove(id: string) {
    await queueService.approve(id);
  }

  async function handleReject(id: string) {
    await queueService.reject(id);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-medium text-white/70">Outreach Queue</h2>
        <p className="text-xs text-white/35">
          Every draft is grounded in evidence and confidence-scored. Nothing sends without your approval.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-10 text-sm text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading outreach queue…
        </div>
      )}

      {!loading && error && <p className="py-10 text-sm text-red-400">{error}</p>}

      {!loading && !error && drafts.length === 0 && (
        <p className="py-10 text-sm text-white/40">
          No drafts queued yet — generate one from a company&apos;s Executive Report once an
          analysis is approved by the Guardrail agent.
        </p>
      )}

      {!loading && !error && drafts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {drafts.map((draft) => (
            <OutreachCard key={draft.id} draft={draft} onApprove={handleApprove} onReject={handleReject} />
          ))}
        </div>
      )}
    </div>
  );
}