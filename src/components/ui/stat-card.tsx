import React from "react";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  statusDot?: "success" | "warning" | "error" | "cyan" | "indigo" | "none";
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  statusDot = "none",
  icon,
  className = "",
}) => {
  const dotColor: Record<string, string> = {
    success: "bg-status-success",
    warning: "bg-status-warning",
    error: "bg-status-error",
    cyan: "bg-accent-cyan",
    indigo: "bg-accent-indigo",
    none: "",
  };

  return (
    <div
      className={`p-5 rounded-xl border border-border-default bg-surface-primary space-y-2 transition-colors hover:border-border-strong ${className}`}
    >
      <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase tracking-wider">
        <span>{label}</span>
        {icon && <span className="text-zinc-500">{icon}</span>}
      </div>
      <div className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
        {statusDot !== "none" && (
          <span
            className={`w-2 h-2 rounded-full ${dotColor[statusDot]}`}
            aria-hidden="true"
          />
        )}
        <span>{value}</span>
      </div>
      {subtext && <p className="text-xs text-zinc-500">{subtext}</p>}
    </div>
  );
};
