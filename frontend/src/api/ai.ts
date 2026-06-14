import { api } from '../lib/api';
import type { ProjectReadWithTasks, TaskPlan } from '../types/api';

export interface NewProjectPlanPayload {
  name: string;
  description: string;
}

export interface CreateProjectWithPlanPayload {
  name: string;
  description: string | null;
  plan: TaskPlan;
}

export const aiApi = {
  /** Preview a task plan for a brand-new project. */
  planNewProject: (payload: NewProjectPlanPayload) =>
    api.post<TaskPlan>('/projects/ai/plan', payload),

  /** Create the project and commit the reviewed plan. */
  commitNewProject: (payload: CreateProjectWithPlanPayload) =>
    api.post<ProjectReadWithTasks>('/projects/ai/plan/commit', payload),
};
