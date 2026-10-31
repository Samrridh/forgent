"use client";

import React, { useState } from "react";
import { PublishWizardForm, CreatorAgent } from "../creator-types";
import { DEFAULT_WIZARD_FORM } from "../creator-data";
import { StepIdentity } from "./step-identity";
import { StepTaskContract } from "./step-task-contract";
import { StepEndpoint } from "./step-endpoint";
import { StepVerificationSuite } from "./step-verification-suite";
import {
  User,
  FileCode,
  Network,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

interface PublishWizardProps {
  onPublishAgent: (agent: CreatorAgent) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, label: "Identity", icon: User },
  { id: 2, label: "Task Contract", icon: FileCode },
  { id: 3, label: "Endpoint", icon: Network },
  { id: 4, label: "Verification Suite", icon: ShieldCheck },
];

export function PublishWizard({ onPublishAgent, onCancel }: PublishWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PublishWizardForm>(DEFAULT_WIZARD_FORM);
  const [isPublishing, setIsPublishing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const updateFormData = (fields: Partial<PublishWizardForm>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
    setValidationError(null);
  };

  const validateCurrentStep = (): boolean => {
    if (currentStep === 1) {
      if (!formData.name.trim() || formData.name.length < 3) {
        setValidationError("Please enter an agent title with at least 3 characters.");
        return false;
      }
      if (!formData.bio.trim() || formData.bio.length < 20) {
        setValidationError("Please provide a technical bio with at least 20 characters.");
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.pricePerTaskUsd || formData.pricePerTaskUsd < 0.50 || formData.pricePerTaskUsd > 50.00) {
        setValidationError("Per-task price must be between $0.50 and $50.00.");
        return false;
      }
      try {
        JSON.parse(formData.inputSchema);
        JSON.parse(formData.outputFormat);
      } catch {
        setValidationError("Input Schema and Output Format must be valid JSON.");
        return false;
      }
    } else if (currentStep === 3) {
      if (formData.endpointType === "webhook" && (!formData.webhookUrl || !formData.webhookUrl.startsWith("http"))) {
        setValidationError("Please provide a valid HTTPS webhook URL.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setValidationError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const priceUsd = formData.pricePerTaskUsd;
      const priceInr = Math.round(priceUsd * 80);

      const newAgent: CreatorAgent = {
        id: `cr-agent-${Date.now().toString(36)}`,
        slug: slug || "custom-verified-agent",
        name: formData.name,
        category: formData.category,
        bio: formData.bio,
        avatarIcon: formData.avatarIcon,
        version: "v1.0.0",
        status: "ACTIVE",
        verified: true,
        benchmarkScore: 99.7,
        taskVolume30d: 0,
        successRate: 100.0,
        avgLatencyMs: 220,
        pricePerTaskUsd: priceUsd,
        pricePerTaskInr: priceInr,
        earnings30dUsd: 0,
        earnings30dInr: 0,
        endpointUrl: formData.endpointType === "webhook" ? formData.webhookUrl : `local://${formData.selectedTemplateId}`,
        inputSchema: formData.inputSchema,
        outputSchema: formData.outputFormat,
        createdAt: new Date().toISOString(),
      };

      onPublishAgent(newAgent);
      setIsPublishing(false);
    }, 800);
  };

  return (
    <div className="bg-surface-primary border border-border-default rounded-xl p-6 sm:p-8 space-y-8 shadow-xs">
      {/* 4-Step Stepper Header */}
      <div className="border-b border-border-subtle pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id < currentStep || validateCurrentStep()) {
                    setCurrentStep(step.id);
                  }
                }}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                  isCurrent
                    ? "border-cobalt-500 bg-cobalt-50/70 text-cobalt-900 shadow-xs"
                    : isCompleted
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
                    : "border-slate-200 bg-porcelain-50 text-slate-500"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-mono font-bold ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-cobalt-500 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Step 0{step.id}
                  </div>
                  <div className="text-xs font-bold truncate">{step.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {validationError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
          {validationError}
        </div>
      )}

      {/* Step Views */}
      <div className="min-h-[380px]">
        {currentStep === 1 && (
          <StepIdentity formData={formData} onChange={updateFormData} />
        )}
        {currentStep === 2 && (
          <StepTaskContract formData={formData} onChange={updateFormData} />
        )}
        {currentStep === 3 && (
          <StepEndpoint formData={formData} onChange={updateFormData} />
        )}
        {currentStep === 4 && (
          <StepVerificationSuite
            formData={formData}
            onChange={updateFormData}
            onPublish={handlePublish}
            isPublishing={isPublishing}
          />
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentStep < 4 && (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <span>Continue to Step {currentStep + 1}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
