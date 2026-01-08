import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="gl-page">
          <div className="gl-card">
            <h2 className="gl-card-title">Щось пішло не так</h2>
            <p className="gl-muted">
              Сталася помилка. Спробуйте оновити сторінку або очистити кеш.
            </p>
            {this.state.error && (
              <details style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
                <summary>Деталі помилки</summary>
                <pre style={{ marginTop: "0.5rem", color: "var(--danger)" }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              className="gl-btn gl-btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{ marginTop: "1rem" }}
            >
              Оновити сторінку
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
