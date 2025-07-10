import type { TabItem } from '@/types/components';

export const APP_TABS: TabItem[] = [
  { id: 'scan', label: '스캔' },
  { id: 'settings', label: '설정' },
  { id: 'history', label: '기록' },
];

export const DEFAULT_ACTIVE_TAB = 'scan';
