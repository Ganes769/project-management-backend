import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

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
    <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200/80 bg-rose-50/80 px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-950">
        {title ?? 'Failed to load'}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-rose-700/90">
        {getMessage(error)}
      </p>
      {onRetry && (
        <Button
          type="button"
          variant="danger"
          size="sm"
          className="mt-5"
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
    </div>
  );
}
