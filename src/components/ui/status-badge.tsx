import React from "react";

export type DomainStatus =
  | "VERIFIED"
  | "PASSED"
  | "FAILED"
  | "REPLACED"
  | "PENDING"
  | "WARNING"
  | "CONTRACT_READY"
  | "REQUIRES_REVIEW"
  | "RUNNING"
  | "ACTIVE"
  | "PAUSED"
  | "RETIRED";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: DomainStatus | string;
  label?: string;
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  pulse = false,
  className = "",
  ...props
}) => {
  const normalized = status.toUpperCase();

  let styleConfig = {
    bg: "bg-surface-elevated",
    text: "text-zinc-300",
    border: "border-border-default",
    dot: "bg-zinc-400",
  };

  switch (normalized) {
    case "VERIFIED":
    case "PASSED":
    case "ACTIVE":
      styleConfig = {
        bg: "bg-status-success/15",
        text: "text-status-success",
        border: "border-status-success/30",
        dot: "bg-status-success",
      };
      break;
    case "FAILED":
      styleConfig = {
        bg: "bg-status-error/15",
        text: "text-status-error",
        border: "border-status-error/30",
        dot: "bg-status-error",
      };
      break;
    case "REPLACED":
    case "WARNING":
    case "REQUIRES_REVIEW":
      styleConfig = {
        bg: "bg-status-warning/15",
        text: "text-status-warning",
        border: "border-status-warning/30",
        dot: "bg-status-warning",
      };
      break;
    case "RUNNING":
      styleConfig = {
        bg: "bg-accent-cyan/15",
        text: "text-accent-cyan",
        border: "border-accent-cyan/30",
        dot: "bg-accent-cyan",
      };
      pulse = true;
      break;
    case "CONTRACT_READY":
      styleConfig = {
        bg: "bg-accent-indigo/15",
        text: "text-accent-indigo",
        border: "border-accent-indigo/30",
        dot: "bg-accent-indigo",
      };
      break;
    case "PENDING":
    case "PAUSED":
    case "RETIRED":
      styleConfig = {
        bg: "bg-status-inactive/15",
        text: "text-status-inactive",
        border: "border-status-inactive/30",
        dot: "bg-status-inactive",
      };
      break;
  }

  const displayText = label || status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border ${styleConfig.bg} ${styleConfig.text} ${styleConfig.border} select-none ${className}`}
      {...props}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${styleConfig.dot} ${
          pulse ? "animate-pulse" : ""
        }`}
        aria-hidden="true"
      />
      <span>{displayText}</span>
    </span>
  );
};
