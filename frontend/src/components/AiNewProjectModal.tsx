import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownRight, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { ApiError } from '../lib/api';
import {
  useCreateProjectWithPlan,
  useGenerateNewProjectPlan,
} from '../hooks/useAi';
import type { GeneratedTask, TaskPlan } from '../types/api';
import { Button } from './Button';
import { Field, TextArea, TextInput } from './Field';
import { Modal } from './Modal';
import { PriorityBadge } from './Badge';
import { Spinner } from './Spinner';

interface AiNewProjectModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Create a fresh project from an AI-generated task plan:
 *   1. User enters project name + brief, clicks Generate.
 *   2. User reviews tasks, then Create project commits everything.
 */
export function AiNewProjectModal({ open, onClose }: AiNewProjectModalProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [plan, setPlan] = useState<TaskPlan | null>(null);
  const [discarded, setDiscarded] = useState<Set<string>>(new Set());

  const generate = useGenerateNewProjectPlan();
  const create = useCreateProjectWithPlan();

  const visibleTasks = useMemo<GeneratedTask[]>(() => {
    if (!plan) return [];
    return plan.tasks
      .filter((t) => !discarded.has(t.key))
      .map((t) => ({
        ...t,
        depends_on: t.depends_on.filter((k) => !discarded.has(k)),
      }));
  }, [plan, discarded]);

  const titleByKey = useMemo(() => {
    const map: Record<string, string> = {};
    plan?.tasks.forEach((t) => (map[t.key] = t.title));
    return map;
  }, [plan]);

  const reset = () => {
    setName('');
    setDescription('');
    setPlan(null);
    setDiscarded(new Set());
    generate.reset();
    create.reset();
  };

  const handleClose = () => {
    if (generate.isPending || create.isPending) return;
    reset();
    onClose();
  };

  const canGenerate =
    name.trim().length >= 2 && description.trim().length >= 10;

  const handleGenerate = () => {
    if (!canGenerate) return;
    generate.mutate(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: (result) => {
          setPlan(result);
          setDiscarded(new Set());
        },
      },
    );
  };

  const handleCreate = () => {
    if (!plan) return;
    create.mutate(
      {
        name: name.trim(),
        description: description.trim() || null,
        plan: { tasks: visibleTasks },
      },
      {
        onSuccess: (project) => {
          reset();
          onClose();
          navigate(`/projects/${project.project_id}`);
        },
      },
    );
  };

  const toggleDiscard = (key: string) => {
    setDiscarded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const generateError =
    generate.error instanceof ApiError
      ? generate.error.message
      : generate.error instanceof Error
        ? generate.error.message
        : null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create project with AI"
      description="Describe your project and AI will draft tasks with dependencies."
      size="lg"
    >
      {!plan ? (
        <div className="space-y-4">
          <Field label="Project name" htmlFor="ai-project-name" required>
            <TextInput
              id="ai-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Payment API"
              disabled={generate.isPending}
              autoFocus
            />
          </Field>

          <Field
            label="Project brief"
            htmlFor="ai-project-brief"
            hint="Describe goals and scope. AI will generate 5-10 tasks with dependencies."
            required
          >
            <TextArea
              id="ai-project-brief"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Build a Stripe payment integration with webhooks, refunds dashboard, and end-to-end tests."
              rows={6}
              minLength={10}
              maxLength={4000}
              disabled={generate.isPending}
            />
          </Field>

          {generateError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
              {generateError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={generate.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              leftIcon={<Wand2 className="h-4 w-4" />}
              loading={generate.isPending}
              disabled={!canGenerate}
              onClick={handleGenerate}
            >
              Generate plan
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
            <span className="font-medium text-slate-800">{name.trim()}</span>
            <span className="mx-2 text-slate-300">·</span>
            <strong>{visibleTasks.length}</strong> task
            {visibleTasks.length === 1 ? '' : 's'} to create
          </div>

          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <Sparkles className="h-4 w-4 text-brand-500" />
              Review the plan before creating the project
            </p>
            <button
              type="button"
              onClick={() => {
                setPlan(null);
                setDiscarded(new Set());
                generate.reset();
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Start over
            </button>
          </div>

          <ol className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {plan.tasks.map((t, idx) => {
              const isDiscarded = discarded.has(t.key);
              return (
                <li
                  key={t.key}
                  className={[
                    'rounded-xl border p-3 transition',
                    isDiscarded
                      ? 'border-slate-200 bg-slate-50 opacity-60'
                      : 'border-slate-200 bg-white shadow-sm',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={[
                          'text-sm font-medium',
                          isDiscarded
                            ? 'text-slate-400 line-through'
                            : 'text-slate-900',
                        ].join(' ')}
                      >
                        {t.title}
                      </p>
                      {t.detail && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {t.detail}
                        </p>
                      )}
                      {t.depends_on.length > 0 && (
                        <p className="mt-1.5 flex items-start gap-1 text-xs text-slate-500">
                          <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>
                            after{' '}
                            {t.depends_on.map((dk, i) => (
                              <span key={dk}>
                                <span
                                  className={
                                    discarded.has(dk)
                                      ? 'text-slate-400 line-through'
                                      : 'font-medium text-slate-700'
                                  }
                                >
                                  {titleByKey[dk] ?? dk}
                                </span>
                                {i < t.depends_on.length - 1 && ', '}
                              </span>
                            ))}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PriorityBadge priority={t.priority} />
                      <button
                        type="button"
                        onClick={() => toggleDiscard(t.key)}
                        className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        aria-label={
                          isDiscarded
                            ? `Restore ${t.title}`
                            : `Discard ${t.title}`
                        }
                        title={isDiscarded ? 'Restore' : 'Discard'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {create.isPending && (
            <Spinner label="Creating project…" className="py-2" />
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={create.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              leftIcon={<Sparkles className="h-4 w-4" />}
              loading={create.isPending}
              disabled={visibleTasks.length === 0}
              onClick={handleCreate}
            >
              Create project
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
