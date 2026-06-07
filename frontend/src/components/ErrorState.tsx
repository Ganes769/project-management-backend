import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
}

function getMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong.';
}

export function ErrorState({ title, error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
      <AlertCircle className="mb-3 h-8 w-8 text-rose-500" />
      <h3 className="text-base font-semibold text-rose-900">
        {title ?? 'Failed to load'}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-rose-700">{getMessage(error)}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
