import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, ListTodo } from 'lucide-react';
import { Button } from '../components/Button';
import { PriorityBadge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Field, Select } from '../components/Field';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { useProjects } from '../hooks/useProjects';
import { useDeleteTask, useTasks, useUpdateTask } from '../hooks/useTasks';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskListFilters,
  type TaskPriority,
  type TaskStatus,
} from '../types/api';
import {
  formatDate,
  isOverdue,
  priorityLabel,
  statusLabel,
} from '../lib/format';

export function TasksPage() {
  const [filters, setFilters] = useState<TaskListFilters>({});
  const { data: tasks, isLoading, error, refetch } = useTasks(filters);
  const { data: projects } = useProjects();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const projectsById = useMemo(() => {
    const map = new Map<number, string>();
    projects?.forEach((p) => map.set(p.project_id, p.name));
    return map;
  }, [projects]);

  const hasFilters =
    filters.project_id !== undefined ||
    filters.task_status !== undefined ||
    filters.task_priority !== undefined ||
    filters.over_due === true;

  return (
    <>
      <PageHeader
        title="All Tasks"
        description="Cross-project overview with quick status updates."
      />

      <div className="page-body">
        <div className="surface-panel p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Filter className="h-4 w-4 text-slate-500" />
            Filters
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Project">
              <Select
                value={filters.project_id ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    project_id: e.target.value
                      ? Number.parseInt(e.target.value, 10)
                      : undefined,
                  }))
                }
              >
                <option value="">All projects</option>
                {projects?.map((p) => (
                  <option key={p.project_id} value={p.project_id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Status">
              <Select
                value={filters.task_status ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    task_status: (e.target.value as TaskStatus) || undefined,
                  }))
                }
              >
                <option value="">Any status</option>
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel[s]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Priority">
              <Select
                value={filters.task_priority ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    task_priority:
                      (e.target.value as TaskPriority) || undefined,
                  }))
                }
              >
                <option value="">Any priority</option>
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {priorityLabel[p]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Overdue only">
              <label className="flex h-9 cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
                  checked={filters.over_due === true}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      over_due: e.target.checked || undefined,
                    }))
                  }
                />
                Show overdue only
              </label>
            </Field>
          </div>
          {hasFilters && (
            <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
              <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
                Reset filters
              </Button>
            </div>
          )}
        </div>

        {isLoading && <Spinner label="Loading tasks…" className="py-20" />}

        {error && <ErrorState error={error} onRetry={() => void refetch()} />}

        {tasks && tasks.length === 0 && (
          <EmptyState
            icon={ListTodo}
            title="No tasks match"
            description={
              hasFilters
                ? 'Try adjusting your filters.'
                : 'Create a project, then add tasks to it.'
            }
          />
        )}

        {tasks && tasks.length > 0 && (
          <div className="surface-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3.5">Task</th>
                    <th className="px-5 py-3.5">Project</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Priority</th>
                    <th className="px-5 py-3.5">Due</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((task) => {
                    const overdue = isOverdue(task.due_date, task.status);
                    return (
                      <tr
                        key={task.id}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-900">
                            {task.title}
                          </div>
                          {task.detail && (
                            <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                              {task.detail}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            to={`/projects/${task.project_id}`}
                            className="font-medium text-brand-700 hover:text-brand-800 hover:underline"
                          >
                            {projectsById.get(task.project_id) ??
                              `#${task.project_id}`}
                          </Link>
                        </td>
                        <td className="px-5 py-4">
                          <Select
                            className="!h-8 !py-1 text-xs"
                            value={task.status}
                            onChange={(e) =>
                              updateTask.mutate({
                                taskId: task.id,
                                payload: {
                                  status: e.target.value as TaskStatus,
                                },
                              })
                            }
                          >
                            {TASK_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {statusLabel[s]}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-5 py-4">
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={
                              overdue
                                ? 'font-medium text-rose-600'
                                : 'text-slate-600'
                            }
                          >
                            {formatDate(task.due_date)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTask.mutate(task.id)}
                            className="text-rose-600 hover:bg-rose-50"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
