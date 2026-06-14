import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/ai';
import type { CreateProjectWithPlanPayload, NewProjectPlanPayload } from '../api/ai';
import { queryKeys } from '../lib/queryClient';

export function useGenerateNewProjectPlan() {
  return useMutation({
    mutationFn: (payload: NewProjectPlanPayload) =>
      aiApi.planNewProject(payload),
  });
}

export function useCreateProjectWithPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectWithPlanPayload) =>
      aiApi.commitNewProject(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
    meta: { successMessage: 'Project created' },
  });
}
