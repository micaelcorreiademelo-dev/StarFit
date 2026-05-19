import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background-dark p-6 text-center">
          <div className="size-20 bg-red-500/10 rounded-full flex flex-col items-center justify-center text-red-500 mb-6 border border-red-500/20">
            <span className="material-symbols-outlined text-4xl">error</span>
          </div>
          <h1 className="text-3xl font-black text-text-light-primary dark:text-text-dark-primary mb-4">Ops! Algo deu errado.</h1>
          <p className="text-text-light-secondary dark:text-text-dark-secondary mb-8 max-w-md">
            Ocorreu um erro inesperado ao carregar esta página. Nossa equipe já foi notificada.
          </p>
          <div className="bg-card-dark border border-border-dark p-4 rounded-lg w-full max-w-xl overflow-auto text-left mb-8 shadow-inner">
            <p className="text-red-400 font-mono text-sm mb-2">{this.state.error?.toString()}</p>
            {this.state.errorInfo && (
              <pre className="text-[10px] text-text-secondary opacity-70 whitespace-pre-wrap">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="bg-primary text-background-dark font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/30 hover:brightness-110 active:scale-95 transition-all"
            >
              Recarregar Página
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              className="bg-card-dark border border-border-dark text-text-primary font-bold py-3 px-6 rounded-xl hover:bg-border-dark transition-all"
            >
              Resetar Acesso
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
