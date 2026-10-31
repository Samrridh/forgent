"use client";

import React from "react";

interface TelemetryGaugeProps {
  value: number; // 0 to 100
  label: string;
  sublabel: string;
  metricText: string;
  status: "success" | "warning" | "error" | "neutral";
  size?: number;
}

export function TelemetryGauge({
  value,
  label,
  sublabel,
  metricText,
  status,
  size = 140,
}: TelemetryGaugeProps) {
  // SVG Radial Gauge geometry
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use 270 degree arc (3/4 of circle)
  const arcFraction = 0.75;
  const totalArc = circumference * arcFraction;
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeDashoffset = totalArc - (clampedValue / 100) * totalArc;

  const colorMap = {
    success: {
      stroke: "#059669", // emerald-600
      glow: "rgba(5, 150, 105, 0.2)",
      text: "text-emerald-700",
      bgBadge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    warning: {
      stroke: "#D97706", // amber-600
      glow: "rgba(217, 119, 6, 0.2)",
      text: "text-amber-700",
      bgBadge: "bg-amber-50 text-amber-800 border-amber-200",
    },
    error: {
      stroke: "#DC2626", // red-600
      glow: "rgba(220, 38, 38, 0.2)",
      text: "text-red-700",
      bgBadge: "bg-red-50 text-red-800 border-red-200",
    },
    neutral: {
      stroke: "#0B4FBA", // cobalt-500
      glow: "rgba(11, 79, 186, 0.2)",
      text: "text-cobalt-700",
      bgBadge: "bg-cobalt-50 text-cobalt-800 border-cobalt-200",
    },
  };

  const styleConfig = colorMap[status];

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-135 transition-all duration-700 ease-out"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            strokeDasharray={`${totalArc} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Animated Value Stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={styleConfig.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={`${totalArc} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 4px ${styleConfig.glow})` }}
          />
        </svg>

        {/* Centered Metric Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-xl font-bold font-mono tracking-tight ${styleConfig.text}`}>
            {metricText}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
            {sublabel}
          </span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <div className="text-xs font-semibold text-slate-800">{label}</div>
      </div>
    </div>
  );
}
