import { cn } from "@/lib/utils";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-slate-50">
          <div className="flex flex-col items-center w-full max-w-lg p-8 bg-white rounded-3xl shadow-xl border border-slate-100 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-6">
              <AlertTriangle size={32} />
            </div>

            <h1 className="text-2xl font-bold font-display text-slate-900 mb-2">
              Something went wrong
            </h1>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              We encountered an unexpected issue while rendering this page. You can reload the page or return to the homepage.
            </p>

            {this.state.error?.message && (
              <div className="p-3.5 w-full rounded-xl bg-slate-50 border border-slate-200/80 overflow-auto mb-6 text-left">
                <p className="text-xs font-mono text-slate-700 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm",
                  "bg-primary text-white hover:bg-primary/95 transition-all shadow-md active:scale-95 cursor-pointer flex-1 min-w-[140px]"
                )}
              >
                <RotateCcw size={16} />
                Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className={cn(
                  "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm",
                  "bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all active:scale-95 cursor-pointer flex-1 min-w-[140px]"
                )}
              >
                <Home size={16} />
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

