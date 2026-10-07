import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
  /** Render the fallback as a fixed full-viewport overlay so it is never pushed below other content (white-screen look). */
  fullScreen?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught exception]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const wrapperClass = this.props.fullScreen
        ? 'fixed inset-0 z-[70] w-full flex items-center justify-center p-6 bg-stone-950/95 text-white backdrop-blur-md'
        : 'min-h-[360px] w-full flex items-center justify-center p-6 bg-stone-900/95 text-white rounded-3xl border border-stone-800 my-4 shadow-2xl';
      return (
        <div className={wrapperClass}>
          <div className="max-w-md text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold font-serif text-white">Temporary Display Issue</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              {this.props.fallbackMessage || 'An unexpected display error occurred. Your practice telemetry and session records are safe.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onReset) this.props.onReset();
                  else window.location.reload();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition"
              >
                <RotateCcw className="w-4 h-4" />
                Reload View
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onReset) {
                    this.props.onReset();
                  } else {
                    window.location.href = '/';
                  }
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-2 cursor-pointer transition border border-stone-700"
              >
                <Home className="w-4 h-4" />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}