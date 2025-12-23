import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Neural Core Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-black flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-6 text-center">
            {/* Pulsing Error Core */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center animate-pulse">
                <div className="w-10 h-10 rounded-full bg-red-500/40 border border-red-500/60"></div>
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h1 className="text-xl font-mono tracking-[0.3em] text-red-400">
                NEURAL CORE ERROR
              </h1>
              <p className="text-sm text-gray-400 font-mono">
                System encountered an unexpected condition
              </p>
            </div>

            {/* Error Details (if dev mode) */}
            {this.state.error && (
              <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-300 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={this.handleReload}
              className="mt-6 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-200 font-mono text-sm tracking-wider transition-all duration-200"
            >
              REINITIALIZE SYSTEM
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
