import { useState } from 'react';
import { Button } from './Button';
import { Field, Select, TextArea, TextInput } from './Field';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskCreate,
  type TaskPriority,
  type TaskRead,
  type TaskStatus,
  type TaskUpdate,
} from '../types/api';
import { priorityLabel, statusLabel } from '../lib/format';

type Initial = Pick<TaskRead, 'title' | 'detail' | 'status' | 'priority' | 'due_date'>;

interface TaskFormProps {
  initial?: Initial;
  submitLabel?: string;
  loading?: boolean;
  error?: unknown;
  onSubmit: (values: TaskCreate | TaskUpdate) => void;
  onCancel?: () => void;
}

export function TaskForm({
  initial,
  submitLabel = 'Save',
  loading,
  error,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [detail, setDetail] = useState(initial?.detail ?? '');
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? 'planned');
  const [priority, setPriority] = useState<TaskPriority>(
    initial?.priority ?? 'medium',
  );
  const [dueDate, setDueDate] = useState(initial?.due_date ?? '');
  const [touched, setTouched] = useState(false);

  const titleError =
    touched && title.trim().length < 2
      ? 'Title must be at least 2 characters'
      : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (title.trim().length < 2) return;
    onSubmit({
      title: title.trim(),
      detail: detail.trim() ? detail.trim() : null,
      status,
      priority,
      due_date: dueDate ? dueDate : null,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Field label="Title" htmlFor="task-title" required error={titleError}>
        <TextInput
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          autoFocus
        />
      </Field>

      <Field label="Detail" htmlFor="task-detail">
        <TextArea
          id="task-detail"
          value={detail ?? ''}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Add context, acceptance criteria, links…"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Status" htmlFor="task-status">
          <Select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Priority" htmlFor="task-priority">
          <Select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {priorityLabel[p]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Due date" htmlFor="task-due-date">
        <TextInput
          id="task-due-date"
          type="date"
          value={dueDate ?? ''}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </Field>

      {error instanceof Error && (
        <p className="text-sm text-rose-600">{error.message}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
