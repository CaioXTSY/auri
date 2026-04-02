import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0–100
  variant?: 'default' | 'xp' | 'success' | 'muted';
  size?: 'sm' | 'md';
  className?: string;
}

const fillClass: Record<NonNullable<ProgressBarProps['variant']>, string> = {
  default: 'bg-brand-600',
  xp: 'bg-gradient-to-r from-accent-600 to-accent-700',
  success: 'bg-emerald-500',
  muted: 'bg-slate-300',
};

export const ProgressBar = ({ value, variant = 'default', size = 'sm', className }: ProgressBarProps) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn(
        'w-full rounded-full bg-slate-100 overflow-hidden',
        size === 'sm' ? 'h-2' : 'h-2.5',
        className,
      )}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-300', fillClass[variant])}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
};
