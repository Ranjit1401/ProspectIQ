import { RelationshipGraph } from "@/components/graph/relationship-graph";

export default function GraphPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-medium text-white/70">Relationship Graph — Anthropic</h2>
        <p className="text-xs text-white/35">Hover a node to see role, confidence, evidence, pain points, and buying signals.</p>
      </div>
      <RelationshipGraph />
    </div>
  );
}
