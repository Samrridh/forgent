import React from "react";

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  className = "",
}) => {
  const positionStyles: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className={`relative inline-flex group ${className}`}>
      {children}
      <div
        role="tooltip"
        className={`absolute ${positionStyles[position]} pointer-events-none hidden group-hover:flex group-focus-within:flex z-50 px-2 py-1 text-[11px] font-mono text-zinc-200 bg-surface-elevated border border-border-default rounded shadow-lg whitespace-nowrap transition-opacity`}
      >
        {content}
      </div>
    </div>
  );
};
