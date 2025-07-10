import type { CleanupOptions } from '@/types/bookmark';

export const DEFAULT_CLEANUP_OPTIONS: CleanupOptions = {
  removeEmptyFolders: true,
  removeDuplicates: true,
  removeErrorPages: true,
};
