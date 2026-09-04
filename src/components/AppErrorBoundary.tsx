import React from 'react';

interface Props { children: React.ReactNode }
interface State { hasError: boolean; message?: string }

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : 'Unexpected application error' };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Puthumai Uzhavan runtime error', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <section className="w-full max-w-md rounded-2xl border p-6 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm opacity-80">Your data is safe. Reload the page and try again.</p>
          <button type="button" className="mt-5 rounded-xl border px-4 py-3 font-medium"
            onClick={() => window.location.reload()}>Reload</button>
          {import.meta.env.DEV && this.state.message ? (
            <pre className="mt-4 max-h-32 overflow-auto text-left text-xs opacity-70">{this.state.message}</pre>
          ) : null}
        </section>
      </main>
    );
  }
}
