import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}

export function PageHeader({
  title,
  description,
  meta,
  actions,
  breadcrumb,
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
      <div className="page-header">
        {breadcrumb && (
          <div className="mb-3 text-sm text-slate-500">{breadcrumb}</div>
        )}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            )}
            {meta && <div className="mt-3">{meta}</div>}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2 lg:pt-1">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
