import { Button } from '@reasonjun/design-system-app';
import { Component, type ReactNode } from 'react';

import { ErrorIcon } from '@/components/atoms/ErrorIcon';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: unknown;
}

/**
 * 렌더링 중 에러가 나도 빈 화면 대신 에러 메시지를 보여줍니다.
 * 잡힌 에러는 React가 기본으로 console.error에 기록합니다.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    const { hasError, error } = this.state;
    if (!hasError) {
      return this.props.children;
    }

    return (
      <div role="alert" style={{ padding: 16 }}>
        <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ErrorIcon />
          <strong>문제가 발생했습니다.</strong>
        </p>
        <p>{error instanceof Error ? error.message : String(error)}</p>
        <Button
          variant="primary"
          size="medium"
          onClick={() => window.location.reload()}
        >
          새로고침
        </Button>
      </div>
    );
  }
}
