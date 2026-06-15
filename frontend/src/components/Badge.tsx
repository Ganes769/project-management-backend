import type { TaskPriority, TaskStatus } from '../types/api';
import {
  priorityLabel,
  priorityStyles,
  statusLabel,
  statusStyles,
} from '../lib/format';

interface StatusBadgeProps {
  status: TaskStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        statusStyles[status],
      ].join(' ')}
    >
      {statusLabel[status]}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        priorityStyles[priority],
      ].join(' ')}
    >
      {priorityLabel[priority]}
    </span>
  );
}
