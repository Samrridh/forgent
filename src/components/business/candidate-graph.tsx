"use client";

import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export interface CandidateGraphStage {
  id: string;
  label: string;
  dependsOn: string[];
}

export function CandidateGraph({ stages }: { stages: CandidateGraphStage[] }) {
  const nodes: Node[] = stages.map((stage, index) => ({
    id: stage.id,
    position: { x: index * 230, y: 70 },
    data: { label: stage.label },
    draggable: false,
  }));
  const ids = new Set(stages.map((stage) => stage.id));
  const edges: Edge[] = stages.flatMap((stage) =>
    stage.dependsOn.filter((id) => ids.has(id)).map((id) => ({
      id: `${id}-${stage.id}`,
      source: id,
      target: stage.id,
    }))
  );
  return (
    <div aria-label="Candidate workflow graph" style={{ height: 300, width: "100%" }}>
      <ReactFlow nodes={nodes} edges={edges} nodesDraggable={false} nodesConnectable={false} fitView>
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
