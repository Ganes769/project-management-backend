import { api } from '../lib/api';
import type {
  ProjectCreate,
  ProjectRead,
  ProjectReadWithTasks,
  ProjectUpdate,
} from '../types/api';

export const projectsApi = {
  list: () => api.get<ProjectRead[]>('/projects'),
  get: (projectId: number) =>
    api.get<ProjectReadWithTasks>(`/projects/${projectId}`),
  create: (payload: ProjectCreate) =>
    api.post<ProjectRead>('/projects', payload),
  update: (projectId: number, payload: ProjectUpdate) =>
    api.patch<ProjectRead>(`/projects/${projectId}`, payload),
  remove: (projectId: number) =>
    api.delete<void>(`/projects/${projectId}`),
};
