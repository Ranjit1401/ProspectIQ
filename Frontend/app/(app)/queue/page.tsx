import { OutreachCard } from "@/components/queue/outreach-card";
import { MOCK_OUTREACH } from "@/lib/mock-data";

export default function QueuePage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-medium text-white/70">Outreach Queue</h2>
        <p className="text-xs text-white/35">
          Every draft is grounded in evidence and confidence-scored. Nothing sends without your approval.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {MOCK_OUTREACH.map((draft) => (
          <OutreachCard key={draft.id} draft={draft} />
        ))}
      </div>
    </div>
  );
}
