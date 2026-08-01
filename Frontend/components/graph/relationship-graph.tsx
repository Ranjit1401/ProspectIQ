"use client";

import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeMouseHandler,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { StakeholderNode, type StakeholderNodeData } from "@/components/graph/custom-node";
import { NodeInfoPanel } from "@/components/graph/node-info-panel";
import { MOCK_NODES, MOCK_EDGES } from "@/lib/mock-data";
import type { RelationshipNode } from "@/types";

const nodeTypes = { stakeholder: StakeholderNode };

const LAYOUT: Record<string, { x: number; y: number }> = {
  "sarah-chen": { x: 260, y: 20 },
  "marcus-webb": { x: 60, y: 200 },
  "priya-nair": { x: 460, y: 200 },
  "daniel-torres": { x: 260, y: 380 },
  "alex-kim": { x: 500, y: 380 },
};

export function RelationshipGraph() {
  const [activeNode, setActiveNode] = useState<RelationshipNode | null>(null);

  const nodes: Node<StakeholderNodeData>[] = useMemo(
    () =>
      MOCK_NODES.map((n) => ({
        id: n.id,
        type: "stakeholder",
        position: LAYOUT[n.id] ?? { x: 0, y: 0 },
        data: { name: n.name, title: n.title, influence: n.influence, confidence: n.confidence },
      })),
    [],
  );

  const edges: Edge[] = useMemo(
    () =>
      MOCK_EDGES.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: true,
        style: { stroke: "rgba(255,255,255,0.25)" },
        labelStyle: { fill: "rgba(255,255,255,0.4)", fontSize: 10 },
        labelBgStyle: { fill: "#0c0c0c", fillOpacity: 0.8 },
      })),
    [],
  );

  const handleNodeMouseEnter: NodeMouseHandler = useCallback((_, node) => {
    const found = MOCK_NODES.find((n) => n.id === node.id) ?? null;
    setActiveNode(found);
  }, []);

  return (
    <div className="relative h-[calc(100vh-11rem)] overflow-hidden rounded-2xl border border-white/8 bg-[#0c0c0c]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeMouseEnter={handleNodeMouseEnter}
        onPaneClick={() => setActiveNode(null)}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.4}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgba(255,255,255,0.06)" />
        <Controls
          className="[&_button]:!bg-[#151515] [&_button]:!border-white/10 [&_button]:!text-white/60"
          showInteractive={false}
        />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(9,9,9,0.75)"
          nodeColor="rgba(255,255,255,0.2)"
          className="!bg-[#111111] !border !border-white/10 rounded-xl overflow-hidden"
        />
      </ReactFlow>

      <NodeInfoPanel node={activeNode} onClose={() => setActiveNode(null)} />
    </div>
  );
}
