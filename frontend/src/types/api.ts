export const TaskStatus = {
  planned: 'planned',
  in_progress: 'in_progress',
  blocked: 'blocked',
  done: 'done',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TASK_STATUSES: TaskStatus[] = [
  TaskStatus.planned,
  TaskStatus.in_progress,
  TaskStatus.blocked,
  TaskStatus.done,
];

export const TaskPriority = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  urgent: 'urgent',
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TASK_PRIORITIES: TaskPriority[] = [
  TaskPriority.low,
  TaskPriority.medium,
  TaskPriority.high,
  TaskPriority.urgent,
];

export interface ProjectRead {
  project_id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface ProjectReadWithTasks extends ProjectRead {
  tasks: TaskRead[];
}

export interface ProjectCreate {
  name: string;
  description?: string | null;
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
}

export interface TaskRead {
  id: number;
  project_id: number;
  title: string;
  detail: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
}

export interface TaskReadWithProject extends TaskRead {
  project: ProjectRead | null;
}

export interface TaskCreate {
  title: string;
  detail?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export interface TaskUpdate {
  title?: string;
  detail?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export interface TaskListFilters {
  project_id?: number;
  project_slug?: string;
  task_status?: TaskStatus;
  task_priority?: TaskPriority;
  over_due?: boolean;
}
