import React from "react";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  variant?: "subtle" | "default" | "strong";
}

export const Divider: React.FC<DividerProps> = ({
  orientation = "horizontal",
  variant = "subtle",
  className = "",
  ...props
}) => {
  const variantStyles: Record<string, string> = {
    subtle: "border-border-subtle",
    default: "border-border-default",
    strong: "border-border-strong",
  };

  if (orientation === "vertical") {
    return (
      <div
        className={`inline-block h-full border-r ${variantStyles[variant]} ${className}`}
        role="separator"
        aria-orientation="vertical"
        {...props}
      />
    );
  }

  return (
    <hr
      className={`w-full border-t ${variantStyles[variant]} ${className}`}
      role="separator"
      aria-orientation="horizontal"
      {...props}
    />
  );
};
