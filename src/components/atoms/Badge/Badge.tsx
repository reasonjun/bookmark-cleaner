import './Badge.css';
import type { ReactNode } from 'react';

export interface BadgeProps {
  /** 색상 테마 */
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  /** 크기 */
  size?: 'small' | 'medium';
  /** 모양 */
  shape?: 'rounded' | 'pill';
  /** 클릭 가능 여부 */
  clickable?: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 자식 요소 */
  children: ReactNode;
}

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'medium',
  shape = 'rounded',
  clickable = false,
  onClick,
}: BadgeProps) => {
  const classNames = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    `badge--${shape}`,
    clickable && 'badge--clickable',
  ]
    .filter(Boolean)
    .join(' ');

  const Component = clickable ? 'button' : 'span';

  return (
    <Component
      className={classNames}
      onClick={clickable ? onClick : undefined}
      type={clickable ? 'button' : undefined}
    >
      {children}
    </Component>
  );
};
