import { useState } from 'react';

import { DEFAULT_ACTIVE_TAB } from '@/constants';

export function useTabNavigation() {
  const [activeTab, setActiveTab] = useState(DEFAULT_ACTIVE_TAB);

  const switchToTab = (tabId: string) => {
    setActiveTab(tabId);
  };

  return {
    activeTab,
    setActiveTab,
    switchToTab,
  };
}
