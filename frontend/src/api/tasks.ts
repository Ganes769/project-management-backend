import { api } from '../lib/api';
import type {
  TaskCreate,
  TaskListFilters,
  TaskRead,
  TaskReadWithProject,
  TaskUpdate,
} from '../types/api';

export const tasksApi = {
  list: (filters: TaskListFilters = {}) =>
    api.get<TaskRead[]>('/tasks', {
      query: filters as Record<string, string | number | boolean | undefined | null>,
    }),
  get: (taskId: number) =>
    api.get<TaskReadWithProject>(`/tasks/${taskId}`),
  create: (projectId: number, payload: TaskCreate) =>
    api.post<TaskRead>('/tasks', payload, { query: { project_id: projectId } }),
  update: (taskId: number, payload: TaskUpdate) =>
    api.patch<TaskRead>(`/tasks/${taskId}`, payload),
  remove: (taskId: number) =>
    api.delete<void>(`/tasks/${taskId}`),
};
