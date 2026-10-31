"use client";

import React, { useState } from "react";
import { EnterprisePipeline } from "@/lib/contracts/enterprise-types";
import { useCurrency } from "@/context/currency-context";
import { DagBuilder } from "./dag-builder";
import {
  ArrowRight,
  Sparkles,
  FileCode,
  Sliders,
} from "lucide-react";

interface PipelineBuilderTabProps {
  pipeline: EnterprisePipeline;
  onUpdatePipeline: (updated: EnterprisePipeline) => void;
  onOpenGeneratorModal: () => void;
  onNavigateToTestFlight: () => void;
  allPipelines: EnterprisePipeline[];
  onSelectPipeline: (id: string) => void;
}

export function PipelineBuilderTab({
  pipeline,
  onUpdatePipeline,
  onOpenGeneratorModal,
  onNavigateToTestFlight,
  allPipelines,
  onSelectPipeline,
}: PipelineBuilderTabProps) {
  const { formatPrice } = useCurrency();
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    pipeline.nodes[0]?.id || ""
  );

  const selectedNode =
    pipeline.nodes.find((n) => n.id === selectedNodeId) || pipeline.nodes[0];

  const formatCost = (costPaise: number) => {
    const usd = costPaise / 8000;
    return formatPrice(usd);
  };

  const handleUpdateParameterValue = (
    nodeId: string,
    paramKey: string,
    newValue: string
  ) => {
    const updatedNodes = pipeline.nodes.map((node) => {
      if (node.id !== nodeId) return node;
      const updatedParams = node.inputParameters.map((param) => {
        if (param.key === paramKey) {
          return { ...param, value: newValue };
        }
        return param;
      });
      return { ...node, inputParameters: updatedParams };
    });

    onUpdatePipeline({
      ...pipeline,
      nodes: updatedNodes,
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Header Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded border font-semibold ${
              pipeline.certificationStatus === "CERTIFIED"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {pipeline.certificationStatus}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {pipeline.nodes.length} Stages &bull; {pipeline.connections.length} Edge Connections
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenGeneratorModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cobalt-700 bg-cobalt-50 hover:bg-cobalt-100 border border-cobalt-200 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modal Generator</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToTestFlight}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-cobalt-500 hover:bg-cobalt-600 rounded-lg shadow-xs transition-colors"
          >
            <span>Proceed to Test Flight</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Interactive Visual DAG Canvas */}
      <DagBuilder
        pipeline={pipeline}
        onUpdatePipeline={onUpdatePipeline}
        allPipelines={allPipelines}
        onSelectPipeline={onSelectPipeline}
        selectedNodeId={selectedNode?.id}
        onSelectNode={(id) => setSelectedNodeId(id)}
      />

      {/* Selected Node Inspector & Live Parameter Editor */}
      {selectedNode && (
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Step Inspector: {selectedNode.stage}
              </div>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">
                {selectedNode.agentName}
              </h4>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                Agent ID: {selectedNode.agentId}
              </span>
              <span className="px-2.5 py-1 rounded bg-cobalt-50 text-cobalt-700 font-semibold">
                Cost: {formatCost(selectedNode.costPaise)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Parameters Config */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cobalt-600" />
                  <span>Input Parameters</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedNode.inputParameters.length} parameters
                </span>
              </div>

              <div className="space-y-3">
                {selectedNode.inputParameters.map((param) => (
                  <div
                    key={param.key}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-800 font-mono">
                          {param.key}
                        </span>
                        {param.required && (
                          <span className="text-[10px] font-mono text-red-500">*</span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 uppercase">
                        {param.type}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">{param.label}</div>

                    {param.mappedFrom ? (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-cobalt-700 bg-cobalt-50/70 p-1.5 rounded border border-cobalt-200">
                        <span className="text-slate-500">Bound from:</span>
                        <span className="font-semibold">
                          {param.mappedFrom.nodeId}.{param.mappedFrom.outputKey}
                        </span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) =>
                          handleUpdateParameterValue(
                            selectedNode.id,
                            param.key,
                            e.target.value
                          )
                        }
                        className="w-full px-2.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded focus:ring-1 focus:ring-cobalt-500 text-slate-800"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Output Parameters Schema */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-cobalt-600" />
                  <span>Emitted Output Schema</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedNode.outputParameters.length} outputs
                </span>
              </div>

              <div className="space-y-3">
                {selectedNode.outputParameters.map((out) => (
                  <div
                    key={out.key}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 font-mono">
                        {out.key}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 uppercase">
                        {out.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">{out.label}</div>
                    <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-emerald-400 overflow-x-auto">
                      {out.sampleValue}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
