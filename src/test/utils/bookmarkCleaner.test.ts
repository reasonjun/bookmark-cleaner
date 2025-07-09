import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  removeEmptyFolders,
  removeDuplicateBookmarks,
  removeErrorPageBookmarks,
  performCleanup,
  backupBookmarks,
  restoreBookmarks,
} from '../../utils/bookmarkCleaner';
import { setupChromeMock, resetChromeMock, mockChrome } from '../mocks/chrome';
import type { SelectableCleanupResult } from '../../types/bookmark';

// Chrome API 설정
beforeEach(() => {
  setupChromeMock();
  resetChromeMock();
});

describe('bookmarkCleaner', () => {
  describe('removeEmptyFolders', () => {
    it('should remove empty folders successfully', async () => {
      const emptyFolders = [
        { id: '5', title: 'Empty Folder 1', parentId: '1' },
        { id: '8', title: 'Empty Folder 2', parentId: '6' },
      ] as chrome.bookmarks.BookmarkTreeNode[];

      const result = await removeEmptyFolders(emptyFolders);

      expect(result).toBe(2);
      expect(mockChrome.bookmarks.remove).toHaveBeenCalledTimes(2);
      expect(mockChrome.bookmarks.remove).toHaveBeenCalledWith('5');
      expect(mockChrome.bookmarks.remove).toHaveBeenCalledWith('8');
    });

    it('should handle removal errors gracefully', async () => {
      const emptyFolders = [
        { id: '5', title: 'Empty Folder', parentId: '1' },
      ] as chrome.bookmarks.BookmarkTreeNode[];

      mockChrome.bookmarks.remove.mockRejectedValueOnce(
        new Error('Remove failed')
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await removeEmptyFolders(emptyFolders);

      expect(result).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to remove empty folder Empty Folder:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should sort folders by depth (deepest first)', async () => {
      const emptyFolders = [
        { id: '1', title: 'Shallow', parentId: '0' },
        { id: '1/2/3', title: 'Deep', parentId: '1/2' },
        { id: '1/2', title: 'Medium', parentId: '1' },
      ] as chrome.bookmarks.BookmarkTreeNode[];

      await removeEmptyFolders(emptyFolders);

      const calls = mockChrome.bookmarks.remove.mock.calls;
      expect(calls[0][0]).toBe('1/2/3'); // deepest first
      expect(calls[1][0]).toBe('1/2');
      expect(calls[2][0]).toBe('1');
    });
  });

  describe('removeDuplicateBookmarks', () => {
    it('should remove duplicate bookmarks keeping the oldest', async () => {
      const duplicates = [
        {
          url: 'https://example.com',
          bookmarks: [
            { id: '1', title: 'First', dateAdded: 1640000000000 },
            { id: '2', title: 'Second', dateAdded: 1640000001000 },
            { id: '3', title: 'Third', dateAdded: 1639999999000 },
          ],
        },
      ] as { url: string; bookmarks: chrome.bookmarks.BookmarkTreeNode[] }[];

      const result = await removeDuplicateBookmarks(duplicates);

      expect(result).toBe(2);
      expect(mockChrome.bookmarks.remove).toHaveBeenCalledTimes(2);
      expect(mockChrome.bookmarks.remove).toHaveBeenCalledWith('1');
      expect(mockChrome.bookmarks.remove).toHaveBeenCalledWith('2');
      expect(mockChrome.bookmarks.remove).not.toHaveBeenCalledWith('3'); // oldest should remain
    });

    it('should handle bookmarks without dateAdded', async () => {
      const duplicates = [
        {
          url: 'https://example.com',
          bookmarks: [
            { id: '1', title: 'First' },
            { id: '2', title: 'Second', dateAdded: 1640000001000 },
          ],
        },
      ] as { url: string; bookmarks: chrome.bookmarks.BookmarkTreeNode[] }[];

      const result = await removeDuplicateBookmarks(duplicates);

      expect(result).toBe(1);
      expect(mockChrome.bookmarks.remove).toHaveBeenCalledWith('2');
    });

    it('should handle removal errors gracefully', async () => {
      const duplicates = [
        {
          url: 'https://example.com',
          bookmarks: [
            { id: '1', title: 'First', dateAdded: 1640000000000 },
            { id: '2', title: 'Second', dateAdded: 1640000001000 },
          ],
        },
      ] as { url: string; bookmarks: chrome.bookmarks.BookmarkTreeNode[] }[];

      mockChrome.bookmarks.remove.mockRejectedValueOnce(
        new Error('Remove failed')
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await removeDuplicateBookmarks(duplicates);

      expect(result).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to remove duplicate bookmark:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('removeErrorPageBookmarks', () => {
    it('should remove error page bookmarks', async () => {
      const errorPages = [
        {
          bookmark: {
            id: '1',
            title: 'Error Page 1',
            url: 'https://error1.com',
          },
        },
        {
          bookmark: {
            id: '2',
            title: 'Error Page 2',
            url: 'https://error2.com',
          },
        },
      ] as { bookmark: chrome.bookmarks.BookmarkTreeNode }[];

      const result = await removeErrorPageBookmarks(errorPages);

      expect(result).toBe(2);
      expect(mockChrome.bookmarks.remove).toHaveBeenCalledTimes(2);
      expect(mockChrome.bookmarks.remove).toHaveBeenCalledWith('1');
      expect(mockChrome.bookmarks.remove).toHaveBeenCalledWith('2');
    });

    it('should handle removal errors gracefully', async () => {
      const errorPages = [
        {
          bookmark: { id: '1', title: 'Error Page', url: 'https://error.com' },
        },
      ] as { bookmark: chrome.bookmarks.BookmarkTreeNode }[];

      mockChrome.bookmarks.remove.mockRejectedValueOnce(
        new Error('Remove failed')
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await removeErrorPageBookmarks(errorPages);

      expect(result).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to remove error page bookmark:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('performCleanup', () => {
    it('should perform complete cleanup and return stats', async () => {
      const itemsToCleanup: SelectableCleanupResult = {
        emptyFolders: [
          { id: '1', title: 'Empty', parentId: '0', isChecked: true },
          { id: '2', title: 'Not Selected', parentId: '0', isChecked: false },
        ],
        duplicateUrls: [
          {
            url: 'https://example.com',
            bookmarks: [
              { id: '3', title: 'Dup1', dateAdded: 1640000000000 },
              { id: '4', title: 'Dup2', dateAdded: 1640000001000 },
            ],
            isChecked: true,
          },
        ],
        errorPages: [
          {
            bookmark: { id: '5', title: 'Error', url: 'https://error.com' },
            isChecked: true,
          },
          {
            bookmark: {
              id: '6',
              title: 'Not Selected',
              url: 'https://error2.com',
            },
            isChecked: false,
          },
        ],
      };

      const result = await performCleanup(itemsToCleanup);

      expect(result).toEqual({
        emptyFoldersRemoved: 1,
        duplicatesRemoved: 1,
        errorPagesRemoved: 1,
        totalProcessed: 3,
      });

      expect(mockChrome.bookmarks.remove).toHaveBeenCalledTimes(3);
    });

    it('should skip unchecked items', async () => {
      const itemsToCleanup: SelectableCleanupResult = {
        emptyFolders: [
          { id: '1', title: 'Empty', parentId: '0', isChecked: false },
        ],
        duplicateUrls: [],
        errorPages: [],
      };

      const result = await performCleanup(itemsToCleanup);

      expect(result).toEqual({
        emptyFoldersRemoved: 0,
        duplicatesRemoved: 0,
        errorPagesRemoved: 0,
        totalProcessed: 0,
      });

      expect(mockChrome.bookmarks.remove).not.toHaveBeenCalled();
    });
  });

  describe('backupBookmarks', () => {
    it('should create a backup of bookmarks', async () => {
      const mockTree = [{ id: '0', title: 'Root', children: [] }];
      mockChrome.bookmarks.getTree.mockResolvedValue(mockTree);

      const result = await backupBookmarks();
      const backup = JSON.parse(result);

      expect(backup.version).toBe(1);
      expect(backup.timestamp).toBeDefined();
      expect(backup.bookmarks).toEqual(mockTree);
      expect(mockChrome.bookmarks.getTree).toHaveBeenCalledTimes(1);
    });
  });

  describe('restoreBookmarks', () => {
    it('should restore bookmarks from backup', async () => {
      const mockBackup = {
        version: 1,
        timestamp: '2024-01-01T00:00:00.000Z',
        bookmarks: [
          {
            id: '0',
            title: 'Root',
            children: [
              {
                id: '1',
                title: 'Bookmarks Bar',
                parentId: '0',
                children: [
                  {
                    id: '2',
                    title: 'Google',
                    parentId: '1',
                    url: 'https://google.com',
                  },
                ],
              },
            ],
          },
        ],
      };

      const currentTree = [
        {
          id: '0',
          title: 'Root',
          children: [{ id: '1', title: 'Existing', parentId: '0' }],
        },
      ];

      mockChrome.bookmarks.getTree.mockResolvedValue(currentTree);

      await restoreBookmarks(JSON.stringify(mockBackup));

      expect(mockChrome.bookmarks.getTree).toHaveBeenCalledTimes(1);
      expect(mockChrome.bookmarks.removeTree).toHaveBeenCalledWith('1');
      expect(mockChrome.bookmarks.create).toHaveBeenCalled();
    });

    it('should handle invalid backup format', async () => {
      const invalidBackup = { invalid: true };
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(
        restoreBookmarks(JSON.stringify(invalidBackup))
      ).rejects.toThrow('Invalid backup format');

      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(restoreBookmarks('invalid json')).rejects.toThrow();

      consoleSpy.mockRestore();
    });

    it('should skip unmodifiable folders during restoration', async () => {
      const mockBackup = {
        version: 1,
        timestamp: '2024-01-01T00:00:00.000Z',
        bookmarks: [
          {
            id: '0',
            title: 'Root',
            children: [
              {
                id: '1',
                title: 'Bookmarks Bar',
                parentId: '0',
                unmodifiable: true,
                children: [
                  {
                    id: '2',
                    title: 'Google',
                    parentId: '1',
                    url: 'https://google.com',
                  },
                ],
              },
            ],
          },
        ],
      };

      const currentTree = [{ id: '0', title: 'Root', children: [] }];
      mockChrome.bookmarks.getTree.mockResolvedValue(currentTree);

      await restoreBookmarks(JSON.stringify(mockBackup));

      // Should not try to create unmodifiable folder, but should create its children
      expect(mockChrome.bookmarks.create).toHaveBeenCalledWith({
        parentId: '1',
        title: 'Google',
        url: 'https://google.com',
      });
    });
  });
});
