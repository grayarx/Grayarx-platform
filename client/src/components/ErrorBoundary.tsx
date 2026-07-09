import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronRight } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

/**
 * Catches runtime React errors at the route boundary. Production users see
 * a calm "something went wrong" page with friendly recovery actions —
 * never a minified React error / stack trace dump.
 *
 * In development (or when the user explicitly toggles "Show technical
 * details") we still surface the error stack so we can debug.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // Surface to the browser console for diagnostics — never to the visible
    // UI of a real customer.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env?.DEV ?? false;
      return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-background text-foreground">
          <div className="flex flex-col items-center w-full max-w-xl text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 ring-1 ring-amber-500/30 flex items-center justify-center mb-6">
              <AlertTriangle size={28} className="text-amber-400" />
            </div>

            <h1 className="font-serif text-3xl mb-3">
              Something went sideways.
            </h1>
            <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
              We've logged the issue and our team will look into it. In the
              meantime, please reload — most issues clear themselves on the next
              try.
            </p>

            <div className="flex flex-wrap gap-3 justify-center mb-8">
              <button
                onClick={this.handleReload}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-primary text-primary-foreground font-medium",
                  "hover:opacity-90 transition cursor-pointer",
                )}
              >
                <RotateCcw size={16} />
                Reload page
              </button>
              <button
                onClick={this.handleHome}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border",
                  "border-white/15 text-foreground bg-transparent",
                  "hover:bg-white/5 transition cursor-pointer",
                )}
              >
                <Home size={16} />
                Back to home
              </button>
            </div>

            {/* Technical details — collapsed by default; auto-expanded in dev. */}
            {(this.state.showDetails || isDev) && this.state.error && (
              <div className="w-full text-left">
                <pre className="p-4 rounded bg-muted/40 border border-white/10 overflow-auto max-h-64 text-[11px] text-muted-foreground whitespace-break-spaces">
                  {this.state.error.stack ?? this.state.error.message}
                </pre>
              </div>
            )}
            {!isDev && (
              <button
                onClick={() =>
                  this.setState((s) => ({ showDetails: !s.showDetails }))
                }
                className="mt-4 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                {this.state.showDetails ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
                {this.state.showDetails
                  ? "Hide technical details"
                  : "Show technical details"}
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
