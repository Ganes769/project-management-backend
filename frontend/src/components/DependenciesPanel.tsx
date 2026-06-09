import { useMemo, useState } from 'react';
import { AlertTriangle, Link, Plus, X } from 'lucide-react';
import {
  useAddDependency,
  useRemoveDependency,
  useTaskDependencies,
} from '../hooks/useTasks';
import type { TaskRead } from '../types/api';
import { ApiError } from '../lib/api';
import { Button } from './Button';
import { Select } from './Field';
import { Spinner } from './Spinner';
import { StatusBadge } from './Badge';

interface DependenciesPanelProps {
  task: TaskRead;
  /** Other tasks in the same project, used to populate the add-dependency dropdown. */
  candidates: TaskRead[];
}

export function DependenciesPanel({ task, candidates }: DependenciesPanelProps) {
  const { data: dependencies, isLoading, error } = useTaskDependencies(task.id);
  const addDep = useAddDependency(task.id);
  const removeDep = useRemoveDependency(task.id);

  const [selectedId, setSelectedId] = useState<string>('');

  const availableCandidates = useMemo(() => {
    const depIds = new Set(dependencies?.map((d) => d.id) ?? []);
    return candidates.filter(
      (c) => c.id !== task.id && !depIds.has(c.id),
    );
  }, [candidates, dependencies, task.id]);

  const unmetCount = useMemo(
    () => dependencies?.filter((d) => d.status !== 'done').length ?? 0,
    [dependencies],
  );

  const handleAdd = () => {
    const id = Number.parseInt(selectedId, 10);
    if (!Number.isFinite(id)) return;
    addDep.mutate(id, {
      onSuccess: () => {
        setSelectedId('');
        addDep.reset();
      },
    });
  };

  const errorMessage =
    addDep.error instanceof ApiError
      ? addDep.error.message
      : addDep.error instanceof Error
        ? addDep.error.message
        : null;

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Link className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-800">
          Depends on
        </h3>
        {dependencies && dependencies.length > 0 && (
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
            {dependencies.length}
          </span>
        )}
      </div>

      {isLoading && <Spinner label="Loading…" className="py-3" />}

      {error && (
        <p className="text-sm text-rose-600">
          Could not load dependencies.
        </p>
      )}

      {dependencies && dependencies.length === 0 && (
        <p className="mb-3 text-xs text-slate-500">
          This task has no prerequisites.
        </p>
      )}

      {unmetCount > 0 && task.status !== 'done' && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Blocked by{' '}
            <strong>
              {unmetCount} unfinished {unmetCount === 1 ? 'task' : 'tasks'}
            </strong>
            . This task can't be marked done until they're complete.
          </span>
        </div>
      )}

      {dependencies && dependencies.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {dependencies.map((dep) => (
            <li
              key={dep.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-inset ring-slate-200"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm text-slate-700">
                  {dep.title}
                </span>
                <StatusBadge status={dep.status} />
              </div>
              <button
                type="button"
                onClick={() => removeDep.mutate(dep.id)}
                disabled={removeDep.isPending}
                className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                aria-label={`Remove dependency on ${dep.title}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {availableCandidates.length > 0 ? (
        <div className="flex items-center gap-2">
          <Select
            className="!h-9 flex-1"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">Select a task to depend on…</option>
            {availableCandidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            disabled={!selectedId}
            loading={addDep.isPending}
            onClick={handleAdd}
          >
            Add
          </Button>
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          No other tasks available in this project.
        </p>
      )}

      {errorMessage && (
        <p className="mt-2 text-xs text-rose-600">{errorMessage}</p>
      )}
    </section>
  );
}
