import './Tab.css';

import type { ReactNode } from 'react';

export interface TabProps {
  /** 활성화 상태 */
  active?: boolean;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 아이콘 */
  icon?: ReactNode;
  /** 뱃지 */
  badge?: ReactNode;
  /** ID (접근성을 위한) */
  id?: string;
  /** aria-controls */
  ariaControls?: string;
  /** 자식 요소 */
  children: ReactNode;
}

export const Tab = ({
  children,
  active = false,
  disabled = false,
  onClick,
  icon,
  badge,
  id,
  ariaControls,
}: TabProps) => {
  const classNames = [
    'tab',
    active && 'tab--active',
    disabled && 'tab--disabled',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      id={id}
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      role="tab"
      aria-selected={active}
      aria-controls={ariaControls}
      type="button"
    >
      {icon && <span className="tab__icon">{icon}</span>}
      <span className="tab__label">{children}</span>
      {badge && <span className="tab__badge">{badge}</span>}
    </button>
  );
};
