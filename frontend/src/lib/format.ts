import type { TaskPriority, TaskStatus } from '../types/api';

export const statusLabel: Record<TaskStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};

export const priorityLabel: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const statusStyles: Record<TaskStatus, string> = {
  planned: 'bg-slate-100 text-slate-700 ring-slate-200',
  in_progress: 'bg-blue-100 text-blue-700 ring-blue-200',
  blocked: 'bg-rose-100 text-rose-700 ring-rose-200',
  done: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
};

export const priorityStyles: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-700 ring-slate-200',
  medium: 'bg-amber-100 text-amber-800 ring-amber-200',
  high: 'bg-orange-100 text-orange-800 ring-orange-200',
  urgent: 'bg-rose-100 text-rose-800 ring-rose-200',
};

export const statusBorderStyles: Record<TaskStatus, string> = {
  planned: 'border-l-slate-400',
  in_progress: 'border-l-blue-500',
  blocked: 'border-l-rose-500',
  done: 'border-l-emerald-500',
};

export const statusColumnStyles: Record<
  TaskStatus,
  { accent: string; bg: string; dot: string }
> = {
  planned: {
    accent: 'border-t-slate-400',
    bg: 'bg-slate-50/90',
    dot: 'bg-slate-400',
  },
  in_progress: {
    accent: 'border-t-blue-500',
    bg: 'bg-blue-50/40',
    dot: 'bg-blue-500',
  },
  blocked: {
    accent: 'border-t-rose-500',
    bg: 'bg-rose-50/40',
    dot: 'bg-rose-500',
  },
  done: {
    accent: 'border-t-emerald-500',
    bg: 'bg-emerald-50/40',
    dot: 'bg-emerald-500',
  },
};

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === 'done') return false;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}
