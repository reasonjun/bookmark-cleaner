import { Spinner } from '../../atoms';
import './LoadingOverlay.css';

export interface LoadingOverlayProps {
  /** 로딩 메시지 */
  message?: string;
  /** 오버레이 표시 여부 */
  visible?: boolean;
  /** 전체 화면 오버레이 */
  fullScreen?: boolean;
  /** 배경 블러 효과 */
  blur?: boolean;
  /** Spinner 크기 */
  spinnerSize?: 'small' | 'medium' | 'large';
}

export const LoadingOverlay = ({
  message = '로딩 중...',
  visible = true,
  fullScreen = false,
  blur = false,
  spinnerSize = 'medium',
}: LoadingOverlayProps) => {
  if (!visible) return null;

  const classNames = [
    'loading-overlay',
    fullScreen && 'loading-overlay--full-screen',
    blur && 'loading-overlay--blur',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames}>
      <div className="loading-overlay__content">
        <Spinner size={spinnerSize} variant="primary" />
        {message && <p className="loading-overlay__message">{message}</p>}
      </div>
    </div>
  );
};
