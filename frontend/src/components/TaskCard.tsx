import { Calendar, MoreVertical, Trash2 } from 'lucide-react';
import { useRef, useState, useEffect, type ReactNode } from 'react';
import type { SubtaskProgress, TaskRead } from '../types/api';
import { TASK_STATUSES } from '../types/api';
import {
  formatDate,
  isOverdue,
  statusBorderStyles,
  statusLabel,
} from '../lib/format';
import { PriorityBadge, StatusBadge } from './Badge';

interface TaskCardProps {
  task: TaskRead;
  compact?: boolean;
  dragHandle?: ReactNode;
  subtaskProgress?: SubtaskProgress | null;
  onClick?: (task: TaskRead) => void;
  onStatusChange?: (taskId: number, status: TaskRead['status']) => void;
  onDelete?: (taskId: number) => void;
}

export function TaskCard({
  task,
  compact = false,
  dragHandle,
  subtaskProgress,
  onClick,
  onStatusChange,
  onDelete,
}: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const overdue = isOverdue(task.due_date, task.status);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  const cardBody = (
    <>
      <div className="flex items-start justify-between gap-2">
        <h4 className="line-clamp-2 text-sm font-medium leading-snug text-slate-900">
          {task.title}
        </h4>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            className="rounded-md p-1 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
            aria-label="Task actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-900/5"
              onClick={(e) => e.stopPropagation()}
            >
              {onStatusChange && (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Move to
                  </div>
                  {TASK_STATUSES.filter((s) => s !== task.status).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        onStatusChange(task.id, s);
                        setMenuOpen(false);
                      }}
                    >
                      {statusLabel[s]}
                    </button>
                  ))}
                  {onDelete && <div className="my-1 h-px bg-slate-100" />}
                </>
              )}
              {onDelete && (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                  onClick={() => {
                    onDelete(task.id);
                    setMenuOpen(false);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {task.detail && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {task.detail}
        </p>
      )}

      {subtaskProgress && subtaskProgress.total > 0 && (
        <p className="mt-2 text-xs font-medium text-slate-500">
          {subtaskProgress.done}/{subtaskProgress.total} subtasks done
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {!compact && <StatusBadge status={task.status} />}
          <PriorityBadge priority={task.priority} />
        </div>
        {task.due_date && (
          <div
            className={[
              'inline-flex items-center gap-1 text-xs',
              overdue ? 'font-medium text-rose-600' : 'text-slate-500',
            ].join(' ')}
          >
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(task.due_date)}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div
      className={[
        'group relative flex cursor-pointer overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-sm transition duration-150',
        'hover:border-slate-300 hover:shadow-md',
        !compact && ['border-l-[3px]', statusBorderStyles[task.status]],
      ]
        .flat()
        .filter(Boolean)
        .join(' ')}
      onClick={() => onClick?.(task)}
    >
      {dragHandle && (
        <div className="flex shrink-0 items-stretch border-r border-slate-100 bg-slate-50/90">
          {dragHandle}
        </div>
      )}
      <div className={['min-w-0 flex-1', compact ? 'p-3' : 'p-3.5'].join(' ')}>
        {cardBody}
      </div>
    </div>
  );
}
