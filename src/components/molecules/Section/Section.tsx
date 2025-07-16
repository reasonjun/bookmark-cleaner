import './Section.css';

import { Checkbox } from '@reasonjun/design-system-app';
import type { ChangeEvent, ReactNode } from 'react';

interface SectionProps {
  title: string;
  count?: number;
  allChecked?: boolean;
  someChecked?: boolean;
  onSelectAllChange?: (isChecked: boolean) => void;
  children?: ReactNode; // children prop 명시적으로 추가
}

export const Section = ({
  title,
  children,
  count = 0,
  allChecked = false,
  someChecked = false,
  onSelectAllChange,
}: SectionProps) => {
  const isDisabled = count === 0;

  const handleSelectAllClick = (e: ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent any parent click events
    if (onSelectAllChange && !isDisabled) {
      onSelectAllChange(e.target.checked);
    }
  };

  return (
    <div
      className={`section-component ${isDisabled ? 'section-component--disabled' : ''}`}
    >
      <div className="section-component__header">
        {onSelectAllChange && (
          <Checkbox
            checked={allChecked}
            indeterminate={someChecked && !allChecked}
            onChange={handleSelectAllClick}
            disabled={isDisabled}
          />
        )}
        <span className="section-component__title-wrapper">
          <span className="section-component__title">
            {title} <span className="section-component__count">({count})</span>
          </span>
        </span>
      </div>
      {!isDisabled && (
        <div className="section-component__content">{children}</div>
      )}
    </div>
  );
};
