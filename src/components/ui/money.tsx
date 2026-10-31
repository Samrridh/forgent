import React from "react";

export interface MoneyDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  amountPaise: number;
  showCurrency?: boolean;
  isSimulated?: boolean;
  size?: "sm" | "md" | "lg";
}

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  amountPaise,
  showCurrency = true,
  isSimulated = false,
  size = "md",
  className = "",
  ...props
}) => {
  // Convert integer paise to INR safely without float drift
  const rupees = Math.floor(amountPaise / 100);
  const remainderPaise = Math.abs(amountPaise % 100);

  const formattedRupees = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(rupees);

  const formattedAmount =
    remainderPaise > 0
      ? `${formattedRupees}.${remainderPaise.toString().padStart(2, "0")}`
      : formattedRupees;

  const sizeStyles: Record<string, string> = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-xl font-bold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono select-none ${sizeStyles[size]} ${className}`}
      {...props}
    >
      <span className="text-foreground">
        {showCurrency && <span className="text-zinc-400 mr-0.5">₹</span>}
        <span>{formattedAmount}</span>
      </span>
      {isSimulated && (
        <span className="px-1 py-0.2 rounded text-[10px] font-mono bg-status-warning/15 text-status-warning border border-status-warning/30">
          SIMULATED
        </span>
      )}
    </span>
  );
};
