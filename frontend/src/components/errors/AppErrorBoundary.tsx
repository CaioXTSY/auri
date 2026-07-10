import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type ErrorScope = 'app' | 'dashboard';

interface AppErrorBoundaryProps {
  children: ReactNode;
  scope?: ErrorScope;
  onError?: (error: Error, info: ErrorInfo, errorId: string) => void;
}

interface AppErrorBoundaryState {
  errorId: string | null;
  hasError: boolean;
}

const createErrorId = () => {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `AURI-${Date.now().toString(36).toUpperCase()}-${suffix.toUpperCase()}`;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    errorId: null,
    hasError: false,
  };

  static getDerivedStateFromError(): Partial<AppErrorBoundaryState> {
    return {
      errorId: createErrorId(),
      hasError: true,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const errorId = this.state.errorId ?? createErrorId();

    if (import.meta.env.DEV) {
      console.error(`[${errorId}] Erro de renderização`, error, info);
    }

    this.props.onError?.(error, info, errorId);
  }

  private retry = () => {
    this.setState({ errorId: null, hasError: false });
  };

  private goToDashboard = () => {
    window.location.assign('/dashboard');
  };

  private reload = () => {
    window.location.reload();
  };

  render() {
    const { children, scope = 'app' } = this.props;

    if (!this.state.hasError) {
      return children;
    }

    const isDashboard = scope === 'dashboard';

    return (
      <section
        className={
          isDashboard
            ? 'rounded-xl border border-red-200 bg-white p-6 shadow-sm'
            : 'flex min-h-screen items-center justify-center bg-slate-100 p-6'
        }
        role="alert"
      >
        <div className={isDashboard ? 'max-w-xl' : 'max-w-xl rounded-xl border border-red-200 bg-white p-6 shadow-sm'}>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-700">
            Erro inesperado
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-brand-900">
            Não foi possível exibir esta área.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Tente novamente. Se o problema continuar, informe o código abaixo ao suporte.
          </p>
          <p className="mt-3 rounded-md bg-slate-100 px-3 py-2 font-mono text-xs text-slate-600">
            Código do erro: {this.state.errorId}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" onClick={this.retry}>
              Tentar novamente
            </Button>
            <Button type="button" variant="outline" onClick={this.goToDashboard}>
              Voltar ao painel
            </Button>
            <Button type="button" variant="ghost" onClick={this.reload}>
              Recarregar a aplicação
            </Button>
          </div>
        </div>
      </section>
    );
  }
}
