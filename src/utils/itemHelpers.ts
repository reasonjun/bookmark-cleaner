import type { SelectableCleanupResult } from '@/types/bookmark';
import type { SelectableItemUnion } from '@/types/components';

/**
 * Extracts the appropriate ID from a selectable item based on its category
 */
export const getItemId = (
  item: SelectableItemUnion,
  category: keyof SelectableCleanupResult
): string => {
  if (category === 'duplicateUrls') {
    return (item as SelectableCleanupResult['duplicateUrls'][number]).url;
  }

  if ('id' in item) {
    return item.id;
  }

  // For errorPages category
  return (item as SelectableCleanupResult['errorPages'][number]).bookmark.id;
};

/**
 * Calculates checkbox state for a collection of items
 */
export const getCheckboxState = (items: { isChecked: boolean }[]) => {
  const all = items.every(item => item.isChecked);
  const some = items.some(item => item.isChecked);
  return { allChecked: all, someChecked: some && !all };
};
