import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  message: string;
  action?: ReactNode;
  className?: string;
}

export const ErrorState = ({ message, action, className }: ErrorStateProps) => {
  return (
    <div
      className={cn('flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600', className)}
      role="alert"
    >
      <span>{message}</span>
      {action ? <div className="ml-auto shrink-0">{action}</div> : null}
    </div>
  );
};
