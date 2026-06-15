import {
  Ban,
  CheckCircle2,
  CircleDashed,
  ListTodo,
  PlayCircle,
} from 'lucide-react';
import type { TaskRead } from '../types/api';

interface ProjectOverviewProps {
  tasks: TaskRead[];
}

const statConfig = [
  {
    key: 'total',
    label: 'Total',
    icon: ListTodo,
    color: 'text-slate-700',
    bg: 'bg-slate-50 ring-slate-100',
  },
  {
    key: 'done',
    label: 'Done',
    icon: CheckCircle2,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 ring-emerald-100',
  },
  {
    key: 'in_progress',
    label: 'In progress',
    icon: PlayCircle,
    color: 'text-blue-700',
    bg: 'bg-blue-50 ring-blue-100',
  },
  {
    key: 'blocked',
    label: 'Blocked',
    icon: Ban,
    color: 'text-rose-700',
    bg: 'bg-rose-50 ring-rose-100',
  },
] as const;

export function ProjectOverview({ tasks }: ProjectOverviewProps) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const blocked = tasks.filter((t) => t.status === 'blocked').length;
  const planned = tasks.filter((t) => t.status === 'planned').length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const counts: Record<(typeof statConfig)[number]['key'], number> = {
    total,
    done,
    in_progress: inProgress,
    blocked,
  };

  return (
    <section className="surface-panel overflow-hidden">
      <div className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/80 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">
              Release progress
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
                {pct}%
              </p>
              <p className="text-sm text-slate-500">
                {done} of {total} tasks complete
              </p>
            </div>
          </div>
          {planned > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200/80">
              <CircleDashed className="h-3.5 w-3.5" />
              {planned} planned
            </div>
          )}
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0">
        {statConfig.map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className="flex items-center gap-3 px-5 py-4 sm:py-5">
            <span
              className={[
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
                bg,
                color,
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p
                className={[
                  'mt-0.5 text-xl font-semibold tabular-nums',
                  color,
                ].join(' ')}
              >
                {counts[key]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
