/**
 * 컴포넌트들을 위한 타입 정의
 */

import type { SelectableCleanupResult } from '@/types/bookmark';

/**
 * 탭 관련 타입
 */
export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

/**
 * 아이템 타입 유니언
 */
export type SelectableItemUnion =
  | SelectableCleanupResult['emptyFolders'][number]
  | SelectableCleanupResult['duplicateUrls'][number]
  | SelectableCleanupResult['errorPages'][number];
