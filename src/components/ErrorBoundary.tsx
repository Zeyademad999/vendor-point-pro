import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorLog = `[${new Date().toISOString()}] ErrorBoundary caught: ${
      error.message
    }\nStack: ${error.stack}\nInfo: ${JSON.stringify(errorInfo)}`;
    localStorage.setItem(
      "debug_logs",
      (localStorage.getItem("debug_logs") || "") + "\n" + errorLog
    );
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Check if it's a rate limiting error
      const isRateLimitError =
        this.state.error?.message?.includes("rate limit") ||
        this.state.error?.message?.includes("Too many requests");

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="text-center">
                  <h2 className="text-lg font-semibold mb-2">
                    {isRateLimitError
                      ? "Rate Limit Exceeded"
                      : "Something went wrong"}
                  </h2>
                  <p className="text-sm mb-4">
                    {isRateLimitError
                      ? "You've made too many requests. Please wait a moment before trying again."
                      : "An unexpected error occurred. Please try again."}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={this.handleRetry}
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Try Again
                    </Button>
                    <Button
                      size="sm"
                      onClick={this.handleReload}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Reload Page
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
