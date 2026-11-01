"use client";

import { Background, Controls, MarkerType, Position, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { Bot } from "lucide-react";
import "@xyflow/react/dist/style.css";
import styles from "./candidate-graph.module.css";

export interface CandidateGraphStage {
  id: string;
  label: string;
  dependsOn: string[];
}

export function CandidateGraph({ stages }: { stages: CandidateGraphStage[] }) {
  const nodes: Node[] = stages.map((stage, index) => ({
    id: stage.id,
    position: { x: index * 260, y: 70 },
    data: { label: <div className={styles.nodeContent}><span className={styles.nodeIcon}><Bot size={17} /></span><span className={styles.nodeText}><span className={styles.nodeStep}>STAGE {String(index + 1).padStart(2, "0")}</span><strong>{stage.label}</strong></span></div> },
    className: styles.node,
    style: { animationDelay: `${index * 140}ms` },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    draggable: false,
  }));
  const ids = new Set(stages.map((stage) => stage.id));
  const edges: Edge[] = stages.flatMap((stage) =>
    stage.dependsOn.filter((id) => ids.has(id)).map((id) => ({
      id: `${id}-${stage.id}`,
      source: id,
      target: stage.id,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: "var(--brand-blue)", width: 16, height: 16 },
      className: styles.edge,
    }))
  );
  return (
    <div aria-label="Candidate workflow graph" className={styles.canvas}>
      <div className={styles.caption}><span>WORKFLOW MAP</span><span>{stages.length} STAGES</span></div>
      <ReactFlow nodes={nodes} edges={edges} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} fitView fitViewOptions={{ padding: 0.35 }} minZoom={0.3} maxZoom={1.3}>
        <Background gap={20} size={1} color="var(--border-default)" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  );
}
