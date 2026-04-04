import React, { ReactNode, ReactElement } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for monitoring (integrate with Sentry/Firebase Crashlytics)
    console.error("🔴 Error Boundary caught:", error);
    console.error("Component Stack:", errorInfo.componentStack);

    // Send to error tracking service
    if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
      // Production error logging
      this.captureError(error, errorInfo);
    }
  }

  private captureError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Replace with actual error tracking service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        component: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      }),
    }).catch((err) => console.error("Failed to log error:", err));
  };

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactElement {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return <>{this.props.fallback(this.state.error, this.retry)}</>;
      }

      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h1 className="text-2xl font-bold text-red-700 mb-4">⚠️ Something went wrong</h1>
            <p className="text-gray-700 mb-4">{this.state.error.message || "An unexpected error occurred"}</p>
            <details className="mb-6 p-3 bg-gray-100 rounded text-sm">
              <summary className="font-mono cursor-pointer">Error details</summary>
              <pre className="mt-2 text-xs overflow-auto whitespace-pre-wrap">{this.state.error.stack}</pre>
            </details>
            <div className="flex gap-3">
              <button
                onClick={this.retry}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
