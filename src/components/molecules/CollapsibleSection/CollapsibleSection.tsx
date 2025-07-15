import './CollapsibleSection.css';

import { Checkbox } from '@reasonjun/design-system-app';
import { type ChangeEvent, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  initialOpen?: boolean;
  count?: number;
  allChecked?: boolean;
  someChecked?: boolean;
  onSelectAllChange?: (isChecked: boolean) => void;
  children: ReactNode; // children prop 명시적으로 추가
}

export const CollapsibleSection = ({
  title,
  children,
  initialOpen = false,
  count = 0, // count 기본값 0으로 설정
  allChecked = false,
  someChecked = false,
  onSelectAllChange,
}: CollapsibleSectionProps) => {
  const handleSelectAllClick = (e: ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent collapsing when clicking checkbox
    if (onSelectAllChange) {
      onSelectAllChange(e.target.checked);
    }
  };

  return (
    <details className="collapsible-section" open={initialOpen}>
      <summary className="collapsible-section__header">
        {onSelectAllChange && (
          <Checkbox
            checked={allChecked}
            indeterminate={someChecked && !allChecked}
            onChange={handleSelectAllClick}
            disabled={count === 0} // count가 0일 때 체크박스 비활성화
          />
        )}
        <span className="collapsible-section__title-wrapper">
          <span className="collapsible-section__title">
            {title}{' '}
            {count !== undefined && (
              <span className="collapsible-section__count">({count})</span>
            )}
          </span>
        </span>
        <span className="collapsible-section__icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </summary>
      <div className="collapsible-section__content">
        {count === 0 ? (
          <p className="collapsible-section__empty-message">
            정리할 항목이 없습니다.
          </p>
        ) : (
          children
        )}
      </div>
    </details>
  );
};
