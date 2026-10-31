import React from "react";

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = "",
}) => {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={`flex items-center gap-1 border-b border-border-default overflow-x-auto no-scrollbar ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`group inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-medium border-b-2 transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan ${
              isActive
                ? "border-accent-indigo text-foreground bg-surface-primary/50"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive
                    ? "bg-accent-indigo/20 text-accent-indigo"
                    : "bg-surface-elevated text-zinc-400"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
