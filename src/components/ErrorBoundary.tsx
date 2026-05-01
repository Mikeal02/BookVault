import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { createLogger } from '@/lib/system';

const log = createLogger('error-boundary');

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    log.error('caught', { message: error.message, stack: error.stack, componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-5">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h3 className="text-lg font-display font-bold text-foreground mb-2">Something went wrong</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-5">
            {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="flex items-center gap-2 px-5 py-2.5 gradient-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
