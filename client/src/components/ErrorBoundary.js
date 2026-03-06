import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-card text-card-foreground rounded-xl shadow-md p-8 max-w-lg w-full border border-border">
            <h1 className="text-3xl font-bold text-danger mb-4">Something went wrong.</h1>
            <p className="text-muted-foreground mb-6">An unexpected error occurred in the application.</p>
            <div className="bg-muted p-4 rounded text-left overflow-auto max-h-48 mb-6">
              <code className="text-sm text-danger">{this.state.error?.toString()}</code>
            </div>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-md transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
