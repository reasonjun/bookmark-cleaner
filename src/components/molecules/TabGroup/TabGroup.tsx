import './TabGroup.css';

import { type KeyboardEvent, useEffect, useState } from 'react';

import type { TabItem } from '@/types/components';

import { Tab } from '../../atoms';

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

  const handleKeyDown = (event: KeyboardEvent, tabId: string) => {
    const enabledTabs = tabs.filter(tab => !tab.disabled);
    const currentIndex = enabledTabs.findIndex(tab => tab.id === tabId);
    let targetTab: TabItem | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        targetTab =
          enabledTabs[
            currentIndex > 0 ? currentIndex - 1 : enabledTabs.length - 1
          ];
        break;
      case 'ArrowRight':
        event.preventDefault();
        targetTab =
          enabledTabs[
            currentIndex < enabledTabs.length - 1 ? currentIndex + 1 : 0
          ];
        break;
      case 'Home':
        event.preventDefault();
        targetTab = enabledTabs[0];
        break;
      case 'End':
        event.preventDefault();
        targetTab = enabledTabs[enabledTabs.length - 1];
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleTabClick(tabId);
        return;
      default:
        return;
    }

    if (targetTab) {
      const nextTabElement = document.getElementById(`tab-${targetTab.id}`);
      nextTabElement?.focus();
    }
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
          onKeyDown={event => handleKeyDown(event, tab.id)}
          ariaControls={`tab-panel-${tab.id}`}
        >
          {tab.label}
        </Tab>
      ))}
    </div>
  );
};
