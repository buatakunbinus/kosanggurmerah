import React from "react";

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("App error boundary caught error", error, info);
  }

  handleReset = () => {
    // simple reset via reload; could be improved to only reset react query cache
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-4 text-center">
            <h1 className="text-xl font-semibold text-red-600">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-600 break-all">
              {this.state.error?.message}
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
