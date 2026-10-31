import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangle" | "circle" | "text";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rectangle",
  ...props
}) => {
  const variantStyles: Record<string, string> = {
    rectangle: "rounded-md",
    circle: "rounded-full",
    text: "rounded h-4 w-full",
  };

  return (
    <div
      className={`bg-surface-secondary/70 animate-pulse ${variantStyles[variant]} ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
};
