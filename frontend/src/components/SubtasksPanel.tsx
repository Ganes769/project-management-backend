import { useMemo, useState } from 'react';
import { AlertTriangle, CheckSquare, Plus, Trash2 } from 'lucide-react';
import {
  useCreateSubtask,
  useDeleteTask,
  useTaskSubtasks,
  useUpdateTask,
} from '../hooks/useTasks';
import type { TaskRead } from '../types/api';
import { ApiError } from '../lib/api';
import { Button } from './Button';
import { TextInput } from './Field';
import { Spinner } from './Spinner';

interface SubtasksPanelProps {
  task: TaskRead;
}

export function SubtasksPanel({ task }: SubtasksPanelProps) {
  const { data: subtasks, isLoading, error } = useTaskSubtasks(task.id);
  const createSubtask = useCreateSubtask(task.id);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [title, setTitle] = useState('');

  const progress = useMemo(() => {
    if (!subtasks?.length) return null;
    const total = subtasks.length;
    const done = subtasks.filter((st) => st.status === 'done').length;
    return {
      total,
      done,
      percent: Math.round((done / total) * 100),
    };
  }, [subtasks]);

  const incompleteCount = useMemo(
    () => subtasks?.filter((st) => st.status !== 'done').length ?? 0,
    [subtasks],
  );

  const handleAdd = () => {
    const trimmed = title.trim();
    if (trimmed.length < 2) return;
    createSubtask.mutate(
      { title: trimmed, status: 'planned', priority: 'medium' },
      {
        onSuccess: () => {
          setTitle('');
          createSubtask.reset();
        },
      },
    );
  };

  const toggleDone = (subtask: TaskRead) => {
    const nextStatus = subtask.status === 'done' ? 'planned' : 'done';
    updateTask.mutate({
      taskId: subtask.id,
      payload: { status: nextStatus },
    });
  };

  const errorMessage =
    createSubtask.error instanceof ApiError
      ? createSubtask.error.message
      : createSubtask.error instanceof Error
        ? createSubtask.error.message
        : null;

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-800">Subtasks</h3>
        {progress && (
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
            {progress.done}/{progress.total}
          </span>
        )}
      </div>

      {progress && (
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
            <span>Progress</span>
            <span className="font-medium tabular-nums text-slate-700">
              {progress.percent}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {isLoading && <Spinner label="Loading subtasks…" className="py-3" />}

      {error && (
        <p className="text-sm text-rose-600">Could not load subtasks.</p>
      )}

      {!isLoading && subtasks && subtasks.length === 0 && (
        <p className="mb-3 text-xs text-slate-500">
          Break this task into smaller steps.
        </p>
      )}

      {incompleteCount > 0 && task.status !== 'done' && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Complete all subtasks before marking this task done (
            {incompleteCount} remaining).
          </span>
        </div>
      )}

      {subtasks && subtasks.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {subtasks.map((subtask) => (
            <li
              key={subtask.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-inset ring-slate-200"
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
                  checked={subtask.status === 'done'}
                  onChange={() => toggleDone(subtask)}
                  disabled={updateTask.isPending}
                />
                <span
                  className={[
                    'truncate text-sm',
                    subtask.status === 'done'
                      ? 'text-slate-400 line-through'
                      : 'text-slate-700',
                  ].join(' ')}
                >
                  {subtask.title}
                </span>
              </label>
              <button
                type="button"
                onClick={() => deleteTask.mutate(subtask.id)}
                disabled={deleteTask.isPending}
                className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                aria-label={`Delete subtask ${subtask.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <TextInput
          className="!h-9 flex-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New subtask title…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          disabled={title.trim().length < 2}
          loading={createSubtask.isPending}
          onClick={handleAdd}
        >
          Add
        </Button>
      </div>

      {errorMessage && (
        <p className="mt-2 text-xs text-rose-600">{errorMessage}</p>
      )}
    </section>
  );
}
