import './ProgressBar.css';

export interface ProgressBarProps {
  /** 진행률 (0-100) */
  value: number;
  /** 최대값 (기본값: 100) */
  max?: number;
  /** 높이 (기본값: 4px) */
  height?: number;
  /** 색상 테마 */
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  /** 애니메이션 효과 사용 여부 */
  animated?: boolean;
  /** 줄무늬 패턴 사용 여부 */
  striped?: boolean;
  /** aria-label */
  ariaLabel?: string;
}

export const ProgressBar = ({
  value,
  max = 100,
  height = 4,
  variant = 'primary',
  animated = false,
  striped = false,
  ariaLabel,
}: ProgressBarProps) => {
  const normalizedValue = Math.min(Math.max(0, value), max);

  const classNames = [
    'progress-bar',
    `progress-bar--${variant}`,
    animated && 'progress-bar--animated',
    striped && 'progress-bar--striped',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <progress
      className={classNames}
      value={normalizedValue}
      max={max}
      style={{ height: `${height}px` }}
      aria-label={
        ariaLabel || `Progress: ${Math.round((normalizedValue / max) * 100)}%`
      }
    />
  );
};
