import { AuditTimeline } from "@/components/audit/audit-timeline";
import { MOCK_AUDIT_EVENTS } from "@/lib/mock-data";

export default function AuditPage() {
  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-sm font-medium text-white/70">Audit Trail</h2>
        <p className="text-xs text-white/35">Every agent action, in order, expandable for full detail.</p>
      </div>
      <AuditTimeline events={MOCK_AUDIT_EVENTS} />
    </div>
  );
}
