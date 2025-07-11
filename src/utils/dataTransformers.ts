import type {
  CleanupResult,
  DuplicateBookmark,
  ErrorPageBookmark,
  SelectableCleanupResult,
} from '@/types/bookmark';

/**
 * 스캔 결과를 선택 가능한 형태로 변환합니다.
 */
export function transformToSelectableResult(
  scanResult: CleanupResult
): SelectableCleanupResult {
  return {
    emptyFolders: scanResult.emptyFolders.map(
      (folder: chrome.bookmarks.BookmarkTreeNode) => ({
        ...folder,
        isChecked: true,
      })
    ),
    duplicateUrls: scanResult.duplicateUrls.map((item: DuplicateBookmark) => ({
      ...item,
      isChecked: true,
    })),
    errorPages: scanResult.errorPages.map((item: ErrorPageBookmark) => ({
      ...item,
      isChecked: true,
    })),
  };
}

/**
 * 선택된 항목들만 필터링합니다.
 */
export function filterCheckedItems(selectableResult: SelectableCleanupResult) {
  return {
    emptyFolders: selectableResult.emptyFolders.filter(f => f.isChecked),
    duplicateUrls: selectableResult.duplicateUrls.filter(d => d.isChecked),
    errorPages: selectableResult.errorPages.filter(e => e.isChecked),
  };
}

/**
 * 선택된 항목의 총 개수를 계산합니다.
 */
export function calculateCheckedCount(
  selectableResult: SelectableCleanupResult | null
): number {
  if (!selectableResult) return 0;

  return (
    selectableResult.emptyFolders.filter(f => f.isChecked).length +
    selectableResult.duplicateUrls.filter(d => d.isChecked).length +
    selectableResult.errorPages.filter(e => e.isChecked).length
  );
}

/**
 * 선택 가능한 결과에서 특정 항목의 체크 상태를 업데이트합니다.
 */
export function updateItemCheckState(
  selectableResult: SelectableCleanupResult,
  category: keyof SelectableCleanupResult,
  id: string,
  isChecked: boolean
): SelectableCleanupResult {
  if (category === 'emptyFolders') {
    const updatedCategory = selectableResult[category].map(item => {
      return item.id === id ? { ...item, isChecked } : item;
    });
    return {
      ...selectableResult,
      [category]: updatedCategory,
    };
  } else if (category === 'duplicateUrls') {
    const updatedCategory = selectableResult[category].map(item => {
      return item.url === id ? { ...item, isChecked } : item;
    });
    return {
      ...selectableResult,
      [category]: updatedCategory,
    };
  } else if (category === 'errorPages') {
    const updatedCategory = selectableResult[category].map(item => {
      return item.bookmark.id === id ? { ...item, isChecked } : item;
    });
    return {
      ...selectableResult,
      [category]: updatedCategory,
    };
  }

  return selectableResult;
}
