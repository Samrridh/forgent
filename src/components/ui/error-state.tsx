import React from "react";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  code?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "An operational error occurred",
  message,
  code,
  onRetry,
  className = "",
}) => {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-status-error/30 bg-status-error/10 p-5 space-y-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-full bg-status-error/20 text-status-error shrink-0">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-status-error font-mono">{title}</h4>
            {code && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-status-error/20 text-status-error border border-status-error/30">
                {code}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-300">{message}</p>
        </div>
      </div>
      {onRetry && (
        <div className="pt-2 pl-9">
          <Button variant="danger" size="sm" onClick={onRetry}>
            Retry Operation
          </Button>
        </div>
      )}
    </div>
  );
};
