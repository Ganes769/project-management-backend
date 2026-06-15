import { Calendar, CornerDownRight } from 'lucide-react';
import type { TaskInOrder } from '../types/api';
import { formatDate, isOverdue } from '../lib/format';
import { PriorityBadge, StatusBadge } from './Badge';

interface OrderedTaskListProps {
  tasks: TaskInOrder[];
}

export function OrderedTaskList({ tasks }: OrderedTaskListProps) {
  return (
    <ol className="space-y-3">
      {tasks.map((task, index) => {
        const isDone = task.status === 'done';
        const overdue = isOverdue(task.due_date, task.status);
        return (
          <li
            key={task.id}
            className="flex items-start gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <div
              className={[
                'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold tabular-nums',
                isDone
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100'
                  : 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100',
              ].join(' ')}
            >
              {index + 1}
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={[
                  'text-sm font-medium leading-snug',
                  isDone ? 'text-slate-400 line-through' : 'text-slate-900',
                ].join(' ')}
              >
                {task.title}
              </p>
              {task.detail && (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                  {task.detail}
                </p>
              )}
              {task.depends_on.length > 0 && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
                  <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>
                    Depends on{' '}
                    {task.depends_on.map((dep, i) => (
                      <span key={dep.id}>
                        <span className="font-medium text-slate-700">
                          {dep.title}
                        </span>
                        {i < task.depends_on.length - 1 && ', '}
                      </span>
                    ))}
                  </span>
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 pt-0.5">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.due_date && (
                <span
                  className={[
                    'inline-flex items-center gap-1 text-xs',
                    overdue ? 'font-medium text-rose-600' : 'text-slate-500',
                  ].join(' ')}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(task.due_date)}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
