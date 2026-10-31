"use client";

import React from "react";
import {
  FileCheck2,
  Lock,
  Play,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

export type StepperStage = "SUBMITTED" | "ESCROW_LOCKED" | "RUNNING" | "VERIFYING" | "COMPLETED" | "FAILED";

interface JobStatusStepperProps {
  currentStage: StepperStage;
  isFailed?: boolean;
  failureReason?: string;
}

const STAGES = [
  { key: "SUBMITTED", label: "Submitted", icon: FileCheck2 },
  { key: "ESCROW_LOCKED", label: "Escrow Locked", icon: Lock },
  { key: "RUNNING", label: "Running", icon: Play },
  { key: "VERIFYING", label: "Verifying", icon: ShieldCheck },
  { key: "COMPLETED", label: "Completed", icon: CheckCircle2 },
];

export function JobStatusStepper({
  currentStage,
  isFailed = false,
  failureReason,
}: JobStatusStepperProps) {
  const getStageIndex = (stage: StepperStage) => {
    switch (stage) {
      case "SUBMITTED":
        return 0;
      case "ESCROW_LOCKED":
        return 1;
      case "RUNNING":
        return 2;
      case "VERIFYING":
        return 3;
      case "COMPLETED":
        return 4;
      case "FAILED":
        return 2;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(currentStage);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
          Execution Lifecycle Timeline
        </span>
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800">
            {isFailed ? "EXECUTION_ABORTED" : currentStage}
          </span>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="relative">
        <div className="grid grid-cols-5 gap-2 relative z-10">
          {STAGES.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = !isFailed && currentIndex > idx;
            const isActive = !isFailed && currentIndex === idx;
            const isFailedStep = isFailed && idx === currentIndex;

            return (
              <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs border-2 transition-all ${
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isActive
                      ? "bg-cobalt-500 border-cobalt-500 text-white ring-4 ring-cobalt-100 animate-pulse"
                      : isFailedStep
                      ? "bg-red-500 border-red-500 text-white"
                      : "bg-porcelain-100 border-slate-200 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isFailedStep ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div
                    className={`text-[11px] font-mono font-semibold ${
                      isActive
                        ? "text-cobalt-600"
                        : isCompleted
                        ? "text-emerald-700"
                        : isFailedStep
                        ? "text-red-600"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Step 0{idx + 1}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isFailed && failureReason && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-mono flex items-center gap-2 mt-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>Execution failed: {failureReason}</span>
        </div>
      )}
    </div>
  );
}
