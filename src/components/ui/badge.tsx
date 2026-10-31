import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "indigo" | "cyan" | "outline" | "subtle";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = "",
  variant = "default",
  size = "md",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center font-mono font-medium rounded border select-none";

  const variantStyles: Record<string, string> = {
    default: "bg-surface-elevated text-zinc-300 border-border-default",
    indigo: "bg-accent-indigo/15 text-accent-indigo border-accent-indigo/30",
    cyan: "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30",
    outline: "bg-transparent text-zinc-400 border-border-subtle",
    subtle: "bg-surface-primary text-zinc-400 border-border-subtle",
  };

  const sizeStyles: Record<string, string> = {
    sm: "text-[11px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
