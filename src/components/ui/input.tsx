import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      error,
      helperText,
      leftAddon,
      rightAddon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
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
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-zinc-500">
              {leftAddon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full rounded-lg bg-surface-secondary border ${
              error
                ? "border-status-error focus-visible:ring-status-error"
                : "border-border-default focus-visible:border-border-strong focus-visible:ring-accent-cyan"
            } px-3 py-2 text-sm text-foreground placeholder:text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              leftAddon ? "pl-9" : ""
            } ${rightAddon ? "pr-9" : ""} ${className}`}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-zinc-500">
              {rightAddon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-status-error font-mono">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-zinc-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
