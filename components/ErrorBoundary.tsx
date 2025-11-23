import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f5f0] p-4 font-serif">
          <div className="bg-white p-8 rounded-2xl border-l-8 border-red-500 shadow-2xl max-w-lg w-full">
            <h1 className="text-3xl font-bold text-[#8b4513] mb-4">Something went wrong.</h1>
            <p className="text-gray-600 mb-6">
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-sm text-red-800 font-mono mb-6 overflow-auto max-h-40">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gradient-to-r from-[#8b4513] to-[#d2691e] text-white rounded-xl font-bold hover:shadow-lg transition transform hover:-translate-y-0.5"
            >
              🔄 Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;