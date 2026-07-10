import { cn } from '@/lib/utils';

interface LoadingStatusProps {
  label?: string;
  className?: string;
}

export const LoadingStatus = ({ label = 'Carregando conteúdo', className }: LoadingStatusProps) => (
  <div className={cn('flex items-center justify-center', className)} role="status" aria-live="polite">
    <div
      aria-hidden="true"
      className="h-8 w-8 rounded-full border-4 border-accent-600 border-t-transparent animate-spin"
    />
    <span className="sr-only">{label}</span>
  </div>
);
