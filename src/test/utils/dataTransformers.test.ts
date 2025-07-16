import { describe, expect, it } from 'vitest';

import type {
  CleanupResult,
  SelectableCleanupResult,
} from '@/types/bookmark.ts';
import {
  calculateCheckedCount,
  filterCheckedItems,
  transformToSelectableResult,
  updateItemCheckState,
} from '@/utils/dataTransformers.ts';

describe('dataTransformers', () => {
  const mockCleanupResult: CleanupResult = {
    emptyFolders: [
      { id: '1', title: 'Empty Folder 1', parentId: '0', syncing: false },
      { id: '2', title: 'Empty Folder 2', parentId: '0', syncing: false },
    ],
    duplicateUrls: [
      {
        url: 'https://google.com',
        bookmarks: [
          {
            id: '3',
            title: 'Google 1',
            url: 'https://google.com',
            syncing: false,
          },
          {
            id: '4',
            title: 'Google 2',
            url: 'https://google.com',
            syncing: false,
          },
        ],
      },
    ],
    errorPages: [
      {
        bookmark: {
          id: '5',
          title: 'Error Page',
          url: 'https://error.com',
          syncing: false,
        },
        errorCode: 404,
        errorMessage: 'HTTP 404',
      },
    ],
  };

  describe('transformToSelectableResult', () => {
    it('should transform cleanup result to selectable format', () => {
      const result = transformToSelectableResult(mockCleanupResult);

      expect(result.emptyFolders).toHaveLength(2);
      expect(result.emptyFolders[0].isChecked).toBe(true);
      expect(result.emptyFolders[1].isChecked).toBe(true);

      expect(result.duplicateUrls).toHaveLength(1);
      expect(result.duplicateUrls[0].isChecked).toBe(true);

      expect(result.errorPages).toHaveLength(1);
      expect(result.errorPages[0].isChecked).toBe(true);
    });

    it('should preserve original data', () => {
      const result = transformToSelectableResult(mockCleanupResult);

      expect(result.emptyFolders[0].title).toBe('Empty Folder 1');
      expect(result.duplicateUrls[0].url).toBe('https://google.com');
      expect(result.errorPages[0].errorCode).toBe(404);
    });
  });

  describe('filterCheckedItems', () => {
    it('should filter only checked items', () => {
      const selectableResult: SelectableCleanupResult = {
        emptyFolders: [
          {
            id: '1',
            title: 'Empty Folder 1',
            parentId: '0',
            syncing: false,
            isChecked: true,
          },
          {
            id: '2',
            title: 'Empty Folder 2',
            parentId: '0',
            syncing: false,
            isChecked: false,
          },
        ],
        duplicateUrls: [
          {
            url: 'https://google.com',
            bookmarks: [],
            isChecked: true,
          },
        ],
        errorPages: [
          {
            bookmark: { id: '5', title: 'Error Page', syncing: false },
            errorCode: 404,
            errorMessage: 'HTTP 404',
            isChecked: false,
          },
        ],
      };

      const filtered = filterCheckedItems(selectableResult);

      expect(filtered.emptyFolders).toHaveLength(1);
      expect(filtered.emptyFolders[0].id).toBe('1');

      expect(filtered.duplicateUrls).toHaveLength(1);
      expect(filtered.errorPages).toHaveLength(0);
    });

    it('should return empty arrays when nothing is checked', () => {
      const selectableResult: SelectableCleanupResult = {
        emptyFolders: [
          {
            id: '1',
            title: 'Empty Folder 1',
            parentId: '0',
            syncing: false,
            isChecked: false,
          },
        ],
        duplicateUrls: [
          {
            url: 'https://google.com',
            bookmarks: [],
            isChecked: false,
          },
        ],
        errorPages: [
          {
            bookmark: { id: '5', title: 'Error Page', syncing: false },
            errorCode: 404,
            errorMessage: 'HTTP 404',
            isChecked: false,
          },
        ],
      };

      const filtered = filterCheckedItems(selectableResult);

      expect(filtered.emptyFolders).toHaveLength(0);
      expect(filtered.duplicateUrls).toHaveLength(0);
      expect(filtered.errorPages).toHaveLength(0);
    });
  });

  describe('calculateCheckedCount', () => {
    it('should calculate total checked items', () => {
      const selectableResult: SelectableCleanupResult = {
        emptyFolders: [
          {
            id: '1',
            title: 'Empty Folder 1',
            parentId: '0',
            syncing: false,
            isChecked: true,
          },
          {
            id: '2',
            title: 'Empty Folder 2',
            parentId: '0',
            syncing: false,
            isChecked: false,
          },
        ],
        duplicateUrls: [
          {
            url: 'https://google.com',
            bookmarks: [],
            isChecked: true,
          },
        ],
        errorPages: [
          {
            bookmark: { id: '5', title: 'Error Page', syncing: false },
            errorCode: 404,
            errorMessage: 'HTTP 404',
            isChecked: true,
          },
        ],
      };

      const count = calculateCheckedCount(selectableResult);
      expect(count).toBe(3);
    });

    it('should return 0 for null input', () => {
      const count = calculateCheckedCount(null);
      expect(count).toBe(0);
    });

    it('should return 0 when nothing is checked', () => {
      const selectableResult: SelectableCleanupResult = {
        emptyFolders: [
          {
            id: '1',
            title: 'Empty Folder 1',
            parentId: '0',
            syncing: false,
            isChecked: false,
          },
        ],
        duplicateUrls: [],
        errorPages: [],
      };

      const count = calculateCheckedCount(selectableResult);
      expect(count).toBe(0);
    });
  });

  describe('updateItemCheckState', () => {
    it('should update emptyFolders check state by id', () => {
      const selectableResult: SelectableCleanupResult = {
        emptyFolders: [
          {
            id: '1',
            title: 'Empty Folder 1',
            parentId: '0',
            syncing: false,
            isChecked: true,
          },
          {
            id: '2',
            title: 'Empty Folder 2',
            parentId: '0',
            syncing: false,
            isChecked: true,
          },
        ],
        duplicateUrls: [],
        errorPages: [],
      };

      const updated = updateItemCheckState(
        selectableResult,
        'emptyFolders',
        '1',
        false
      );

      expect(updated.emptyFolders[0].isChecked).toBe(false);
      expect(updated.emptyFolders[1].isChecked).toBe(true);
    });

    it('should update duplicateUrls check state by url', () => {
      const selectableResult: SelectableCleanupResult = {
        emptyFolders: [],
        duplicateUrls: [
          {
            url: 'https://google.com',
            bookmarks: [],
            isChecked: true,
          },
        ],
        errorPages: [],
      };

      const updated = updateItemCheckState(
        selectableResult,
        'duplicateUrls',
        'https://google.com',
        false
      );

      expect(updated.duplicateUrls[0].isChecked).toBe(false);
    });

    it('should not modify other categories', () => {
      const selectableResult: SelectableCleanupResult = {
        emptyFolders: [
          {
            id: '1',
            title: 'Empty Folder 1',
            parentId: '0',
            syncing: false,
            isChecked: true,
          },
        ],
        duplicateUrls: [
          {
            url: 'https://google.com',
            bookmarks: [],
            isChecked: true,
          },
        ],
        errorPages: [],
      };

      const updated = updateItemCheckState(
        selectableResult,
        'emptyFolders',
        '1',
        false
      );

      expect(updated.emptyFolders[0].isChecked).toBe(false);
      expect(updated.duplicateUrls[0].isChecked).toBe(true);
    });
  });
});
