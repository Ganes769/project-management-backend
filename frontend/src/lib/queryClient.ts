import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
  mutationCache: new MutationCache({
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message);
    },
    onSuccess: (_data, _vars, _ctx, mutation) => {
      const successMessage = (mutation.meta as { successMessage?: string } | undefined)
        ?.successMessage;
      if (successMessage) toast.success(successMessage);
    },
  }),
});

export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    list: () => [...queryKeys.projects.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.projects.all, 'detail', id] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: (filters: Record<string, unknown> = {}) =>
      [...queryKeys.tasks.all, 'list', filters] as const,
    detail: (id: number) => [...queryKeys.tasks.all, 'detail', id] as const,
    dependencies: (id: number) =>
      [...queryKeys.tasks.all, 'dependencies', id] as const,
  },
};
