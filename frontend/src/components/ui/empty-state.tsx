import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ message, action, className }: EmptyStateProps) => {
  return (
    <div className={cn('rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500', className)}>
      <p className="text-sm">{message}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
};
