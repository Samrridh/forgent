import React from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  breadcrumbs,
  action,
  className = "",
}) => {
  return (
    <div
      className={`border-b border-border-default pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}
    >
      <div className="space-y-1.5">
        {breadcrumbs && <div className="text-xs text-zinc-500 mb-1">{breadcrumbs}</div>}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {badge}
        </div>
        {description && <p className="text-xs md:text-sm text-zinc-400">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
};
