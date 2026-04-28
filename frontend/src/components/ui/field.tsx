import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FieldProps {
  htmlFor: string;
  label: string;
  description?: string;
  error?: string;
  className?: string;
  labelClassName?: string;
  children: ReactNode;
}

export const Field = ({
  htmlFor,
  label,
  description,
  error,
  className,
  labelClassName,
  children,
}: FieldProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor} className={cn('text-sm text-slate-900', labelClassName)}>
        {label}
      </Label>
      {children}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
      {!error && description ? <p className="text-xs text-slate-500">{description}</p> : null}
    </div>
  );
};
