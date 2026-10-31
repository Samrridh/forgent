import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, helperText, id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-mono font-medium text-zinc-300"
          >
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          disabled={disabled}
          className={`w-full rounded-lg bg-surface-secondary border ${
            error
              ? "border-status-error focus-visible:ring-status-error"
              : "border-border-default focus-visible:border-border-strong focus-visible:ring-accent-cyan"
          } px-3 py-2 text-sm text-foreground placeholder:text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-status-error font-mono">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-zinc-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
