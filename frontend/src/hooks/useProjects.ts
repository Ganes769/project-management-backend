import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import { queryKeys } from '../lib/queryClient';
import type { ProjectCreate, ProjectUpdate } from '../types/api';

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: projectsApi.list,
  });
}

export function useProject(projectId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId ?? -1),
    queryFn: () => projectsApi.get(projectId as number),
    enabled: projectId !== undefined && projectId > 0,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectCreate) => projectsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useUpdateProject(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectUpdate) =>
      projectsApi.update(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) => projectsApi.remove(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
