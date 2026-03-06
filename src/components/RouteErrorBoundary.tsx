import { Component, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** Catches errors in the route tree (e.g. lazy load failure, render throw) so we show a message instead of a blank page. */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              This page failed to load. You can try again or go back to the dashboard.
              <p className="mt-2 text-xs text-muted-foreground">Check the browser console (F12 → Console) for the full error.</p>
              <pre className="mt-2 text-xs overflow-auto max-h-24 bg-muted/50 p-2 rounded">
                {this.state.error.message}
              </pre>
            </AlertDescription>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/dashboard">Dashboard</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try again
              </Button>
            </div>
          </Alert>
        </div>
      );
    }
    return this.props.children;
  }
}
