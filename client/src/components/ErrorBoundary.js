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
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white rounded-xl shadow-md p-8 max-w-lg w-full">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Something went wrong.</h1>
            <p className="text-gray-600 mb-6">An unexpected error occurred in the application.</p>
            <div className="bg-gray-100 p-4 rounded text-left overflow-auto max-h-48 mb-6">
              <code className="text-sm text-red-800">{this.state.error?.toString()}</code>
            </div>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
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
