"use client";

import React, { useState } from "react";
import { PublishWizardForm, CreatorAgent } from "../creator-types";
import { DEFAULT_WIZARD_FORM } from "../creator-data";
import { StepIdentity } from "./step-identity";
import { StepTaskContract } from "./step-task-contract";
import { StepReviewSummary } from "./step-review-summary";
import { StepPackageReview, type ReviewResult } from "./step-package-review";
import {
  User,
  FileCode,
  Network,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  PackageOpen,
} from "lucide-react";

interface PublishWizardProps {
  onPublishAgent: (agent: CreatorAgent) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, label: "Identity", icon: User },
  { id: 2, label: "Task Contract", icon: FileCode },
  { id: 3, label: "Package Review", icon: PackageOpen },
  { id: 4, label: "Endpoint", icon: Network },
  { id: 5, label: "Review & next steps", icon: ShieldCheck },
];

export function PublishWizard({ onCancel }: PublishWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PublishWizardForm>(DEFAULT_WIZARD_FORM);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const updateFormData = (fields: Partial<PublishWizardForm>) => {
    if ("name" in fields || "bio" in fields || "inputSchema" in fields || "outputFormat" in fields) setReview(null);
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
    } else if (currentStep === 4) {
      try {
        const endpoint = new URL(formData.webhookUrl);
        if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error();
      } catch {
        setValidationError("Enter a public HTTPS endpoint without credentials or query parameters.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrev = () => {
    setValidationError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };


  return (
    <div className="bg-surface-primary border border-border-default rounded-xl p-6 sm:p-8 space-y-8 shadow-xs">
      {/* 4-Step Stepper Header */}
      <div className="border-b border-border-subtle pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id < currentStep || (step.id === currentStep + 1 && validateCurrentStep())) {
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
        {currentStep === 4 && (
          <section className="space-y-4"><div className="border-b border-border-subtle pb-4"><h3 className="text-base font-bold text-slate-900">Step 4: Builder-hosted endpoint</h3><p className="text-xs text-slate-500 mt-1">Your service receives a POST request with a JSON task and returns a JSON result.</p></div><label className="block text-sm font-semibold text-slate-800">Public HTTPS endpoint<input className="form-input mt-2" type="url" value={formData.webhookUrl} onChange={(event) => updateFormData({ webhookUrl: event.target.value })} placeholder="https://your-agent.example/run" /></label><div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Expected request: <code>{'{"task":"..."}'}</code>. Expected response: <code>{'{"result":"..."}'}</code>. Do not put credentials in the URL. The uploaded ZIP is not deployed.</div></section>
        )}
        <div hidden={currentStep !== 3}>
          <StepPackageReview key={JSON.stringify([formData.name, formData.bio, formData.inputSchema, formData.outputFormat])} formData={formData} onReviewChange={setReview} />
        </div>
        {currentStep === 5 && (
          <StepReviewSummary report={review?.report || null} formData={formData} onBackToPackage={() => setCurrentStep(3)} />
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
          {currentStep < STEPS.length && (
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
