import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tasksApi } from '../api/tasks';
import { queryKeys } from '../lib/queryClient';
import type { TaskCreate, TaskListFilters, TaskUpdate } from '../types/api';

export function useTasks(filters: TaskListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters as Record<string, unknown>),
    queryFn: () => tasksApi.list(filters),
  });
}

export function useTask(taskId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(taskId ?? -1),
    queryFn: () => tasksApi.get(taskId as number),
    enabled: taskId !== undefined && taskId > 0,
  });
}

export function useCreateTask(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TaskCreate) => tasksApi.create(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
    meta: { successMessage: 'Task created' },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: number; payload: TaskUpdate }) =>
      tasksApi.update(taskId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
    meta: { successMessage: 'Task updated' },
  });
}

export function useUndo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => tasksApi.undo(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('Task restored');
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const undo = useUndo();
  return useMutation({
    mutationFn: (taskId: number) => tasksApi.remove(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('Task deleted', {
        action: {
          label: 'Undo',
          onClick: () => undo.mutate(),
        },
      });
    },
  });
}

export function useTaskDependencies(taskId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks.dependencies(taskId ?? -1),
    queryFn: () => tasksApi.listDependencies(taskId as number),
    enabled: taskId !== undefined && taskId > 0,
  });
}

export function useAddDependency(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dependsOnId: number) =>
      tasksApi.addDependency(taskId, dependsOnId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.dependencies(taskId) });
    },
  });
}

export function useRemoveDependency(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dependsOnId: number) =>
      tasksApi.removeDependency(taskId, dependsOnId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.dependencies(taskId) });
    },
  });
}
