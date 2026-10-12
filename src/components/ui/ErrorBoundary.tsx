import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Home, Leaf, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center bg-brand-50 p-6">
          <div className="text-center max-w-sm">
            <div className="mx-auto h-14 w-14 rounded-xl bg-brand-600 grid place-items-center">
              <Leaf size={28} className="text-white" />
            </div>
            <h1 className="mt-6 font-display font-bold text-2xl text-ink-900">Something went wrong</h1>
            <p className="mt-2 text-ink-600 leading-relaxed">
              An unexpected error occurred. Refresh the page to try again. Any changes that were not saved may be lost, so check your farm records before repeating an action.
            </p>
            <button
              onClick={this.handleReload}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 text-white px-6 py-3 text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              <RefreshCw size={17} /> Refresh page
            </button>
            <a
              href="/"
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors"
            >
              <Home size={17} /> Go to home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
