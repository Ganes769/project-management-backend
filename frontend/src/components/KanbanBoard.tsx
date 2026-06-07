import { useMemo } from 'react';
import type { TaskRead, TaskStatus } from '../types/api';
import { TASK_STATUSES } from '../types/api';
import { statusLabel } from '../lib/format';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  tasks: TaskRead[];
  onTaskClick?: (task: TaskRead) => void;
  onStatusChange?: (taskId: number, status: TaskStatus) => void;
  onDelete?: (taskId: number) => void;
}

export function KanbanBoard({
  tasks,
  onTaskClick,
  onStatusChange,
  onDelete,
}: KanbanBoardProps) {
  const grouped = useMemo(() => {
    const map: Record<TaskStatus, TaskRead[]> = {
      planned: [],
      in_progress: [],
      blocked: [],
      done: [],
    };
    for (const task of tasks) map[task.status].push(task);
    return map;
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUSES.map((status) => {
        const items = grouped[status];
        return (
          <section
            key={status}
            className="flex min-h-[200px] flex-col rounded-2xl bg-slate-100/70 p-3"
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-slate-700">
                {statusLabel[status]}
              </h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
                {items.length}
              </span>
            </header>
            <div className="flex flex-1 flex-col gap-2">
              {items.length === 0 ? (
                <p className="px-1 py-4 text-center text-xs text-slate-400">
                  No tasks
                </p>
              ) : (
                items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={onTaskClick}
                    onStatusChange={onStatusChange}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
