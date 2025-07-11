import { useEffect, useState } from 'react';
import { Tab } from '../../atoms';
import type { TabItem } from '@/types/components';
import './TabGroup.css';

export interface TabGroupProps {
  /** 탭 목록 */
  tabs: TabItem[];
  /** 현재 활성화된 탭 ID */
  activeTab?: string;
  /** 기본 활성화 탭 ID */
  defaultActiveTab?: string;
  /** 탭 변경 핸들러 */
  onChange?: (tabId: string) => void;
  /** 전체 너비 사용 여부 */
  fullWidth?: boolean;
  /** aria-label */
  ariaLabel?: string;
}

export const TabGroup = ({
  tabs,
  activeTab,
  defaultActiveTab,
  onChange,
  fullWidth = false,
  ariaLabel = 'Tab navigation',
}: TabGroupProps) => {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultActiveTab || tabs[0]?.id || ''
  );

  const currentActiveTab =
    activeTab !== undefined ? activeTab : internalActiveTab;

  useEffect(() => {
    if (activeTab !== undefined) {
      setInternalActiveTab(activeTab);
    }
  }, [activeTab]);

  const handleTabClick = (tabId: string) => {
    if (activeTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onChange?.(tabId);
  };

  const classNames = ['tab-group', fullWidth && 'tab-group--full-width']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} role="tablist" aria-label={ariaLabel}>
      {tabs.map(tab => (
        <Tab
          key={tab.id}
          id={`tab-${tab.id}`}
          active={currentActiveTab === tab.id}
          disabled={tab.disabled}
          onClick={() => handleTabClick(tab.id)}
          ariaControls={`tabpanel-${tab.id}`}
        >
          {tab.label}
        </Tab>
      ))}
    </div>
  );
};
