import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  label?: string;
  className?: string;
}

export function Spinner({ label, className }: SpinnerProps) {
  return (
    <div
      className={[
        'flex items-center justify-center gap-2 text-sm text-slate-500',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      {label && <span>{label}</span>}
    </div>
  );
}
