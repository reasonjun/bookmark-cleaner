import { beforeEach, describe, expect, it } from 'vitest';

import type { CleanupOptions } from '@/types/bookmark.ts';
import {
  analyzeBookmarkTree,
  extractAllBookmarks,
  findDuplicateUrls,
  findEmptyFolders,
} from '@/utils/bookmarkAnalyzer.ts';

import {
  mockBookmarkTree,
  resetChromeMock,
  setupChromeMock,
} from '../mocks/chrome';

describe('bookmarkAnalyzer', () => {
  const defaultOptions: CleanupOptions = {
    removeEmptyFolders: true,
    removeDuplicates: true,
    removeErrorPages: true,
  };

  beforeEach(() => {
    setupChromeMock();
    resetChromeMock();
  });

  describe('findEmptyFolders', () => {
    it('should find empty folders', () => {
      const rootNode = mockBookmarkTree[0];
      const emptyFolders = findEmptyFolders(rootNode, []);

      expect(emptyFolders).toHaveLength(2);
      expect(emptyFolders.map(f => f.title)).toContain('Empty Folder');
      expect(emptyFolders.map(f => f.title)).toContain('Another Empty Folder');
    });

    it('should not include root folder even if empty', () => {
      const emptyRoot = {
        id: '0',
        title: 'Root',
        syncing: false,
        children: [],
      };

      const emptyFolders = findEmptyFolders(
        emptyRoot as chrome.bookmarks.BookmarkTreeNode,
        []
      );
      expect(emptyFolders).toHaveLength(1);
    });

    it('should not include folders with children', () => {
      const rootNode = mockBookmarkTree[0];
      const emptyFolders = findEmptyFolders(rootNode, []);

      const folderTitles = emptyFolders.map(f => f.title);
      expect(folderTitles).not.toContain('Bookmarks Bar');
      expect(folderTitles).not.toContain('Other Bookmarks');
    });

    it('should handle deeply nested empty folders', () => {
      const deeplyNestedTree = {
        id: '0',
        title: 'Root',
        syncing: false,
        children: [
          {
            id: '1',
            title: 'Level 1',
            parentId: '0',
            syncing: false,
            children: [
              {
                id: '2',
                title: 'Level 2 Empty',
                parentId: '1',
                syncing: false,
                children: [],
              },
              {
                id: '3',
                title: 'Level 2 With Child',
                parentId: '1',
                syncing: false,
                children: [
                  {
                    id: '4',
                    title: 'Level 3 Empty',
                    parentId: '3',
                    syncing: false,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      };

      const emptyFolders = findEmptyFolders(
        deeplyNestedTree as chrome.bookmarks.BookmarkTreeNode,
        []
      );
      expect(emptyFolders).toHaveLength(2);
      expect(emptyFolders.map(f => f.title)).toContain('Level 2 Empty');
      expect(emptyFolders.map(f => f.title)).toContain('Level 3 Empty');
    });

    it('should not include special folders (with folderType)', () => {
      const treeWithSpecialFolder = {
        id: '0',
        title: 'Root',
        syncing: false,
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            parentId: '0',
            syncing: false,
            folderType: 'bookmarks_bar',
            children: [],
          },
          {
            id: '2',
            title: 'Regular Empty Folder',
            parentId: '0',
            syncing: false,
            children: [],
          },
        ],
      };

      const emptyFolders = findEmptyFolders(
        treeWithSpecialFolder as chrome.bookmarks.BookmarkTreeNode,
        []
      );
      expect(emptyFolders).toHaveLength(1);
      expect(emptyFolders[0].title).toBe('Regular Empty Folder');
    });

    it('should return empty array for tree with no empty folders', () => {
      const treeWithNoEmptyFolders = {
        id: '0',
        title: 'Root',
        syncing: false,
        children: [
          {
            id: '1',
            title: 'Folder with bookmark',
            parentId: '0',
            syncing: false,
            children: [
              {
                id: '2',
                title: 'Test Bookmark',
                parentId: '1',
                url: 'https://test.com',
                dateAdded: 1640000000000,
                syncing: false,
              },
            ],
          },
        ],
      };

      const emptyFolders = findEmptyFolders(
        treeWithNoEmptyFolders as chrome.bookmarks.BookmarkTreeNode,
        []
      );
      expect(emptyFolders).toHaveLength(0);
    });

    it('should accumulate results in provided array', () => {
      const rootNode = mockBookmarkTree[0];
      const existingFolders = [
        {
          id: 'existing',
          title: 'Existing Empty Folder',
          syncing: false,
          children: [],
        } as chrome.bookmarks.BookmarkTreeNode,
      ];

      const emptyFolders = findEmptyFolders(rootNode, existingFolders);

      expect(emptyFolders).toHaveLength(3);
      expect(emptyFolders.map(f => f.title)).toContain('Existing Empty Folder');
      expect(emptyFolders.map(f => f.title)).toContain('Empty Folder');
      expect(emptyFolders.map(f => f.title)).toContain('Another Empty Folder');
    });
  });

  describe('findDuplicateUrls', () => {
    it('should find duplicate URLs', () => {
      const rootNode = mockBookmarkTree[0];
      const duplicates = findDuplicateUrls(rootNode);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].url).toBe('https://google.com');
      expect(duplicates[0].bookmarks).toHaveLength(2);
    });

    it('should not return unique URLs', () => {
      const rootNode = mockBookmarkTree[0];
      const duplicates = findDuplicateUrls(rootNode);

      const urls = duplicates.map(d => d.url);
      expect(urls).not.toContain('https://github.com');
      expect(urls).not.toContain('https://nonexistent-site.com');
    });

    it('should handle empty bookmark tree', () => {
      const emptyNode = {
        id: '0',
        title: 'Root',
        syncing: false,
        children: [],
      };

      const duplicates = findDuplicateUrls(
        emptyNode as chrome.bookmarks.BookmarkTreeNode
      );
      expect(duplicates).toHaveLength(0);
    });
  });

  describe('extractAllBookmarks', () => {
    it('should extract all bookmarks from tree', () => {
      const rootNode = mockBookmarkTree[0];
      const bookmarks = extractAllBookmarks(rootNode);

      expect(bookmarks).toHaveLength(4);

      const urls = bookmarks.map(b => b.url);
      expect(urls).toContain('https://google.com');
      expect(urls).toContain('https://github.com');
      expect(urls).toContain('https://nonexistent-site.com');
    });

    it('should not include folders', () => {
      const rootNode = mockBookmarkTree[0];
      const bookmarks = extractAllBookmarks(rootNode);

      const titles = bookmarks.map(b => b.title);
      expect(titles).not.toContain('Bookmarks Bar');
      expect(titles).not.toContain('Other Bookmarks');
      expect(titles).not.toContain('Empty Folder');
    });

    it('should handle empty tree', () => {
      const emptyNode = {
        id: '0',
        title: 'Root',
        syncing: false,
        children: [],
      };

      const bookmarks = extractAllBookmarks(
        emptyNode as chrome.bookmarks.BookmarkTreeNode
      );
      expect(bookmarks).toHaveLength(0);
    });
  });

  describe('analyzeBookmarkTree', () => {
    it('should analyze entire bookmark tree with default options', () => {
      const rootNode = mockBookmarkTree[0];
      const result = analyzeBookmarkTree(rootNode, defaultOptions);

      expect(result.emptyFolders).toHaveLength(2);
      expect(result.duplicateUrls).toHaveLength(1);
      // errorPages는 이제 분석 대상이 아님
    });

    it('should return proper structure', () => {
      const rootNode = mockBookmarkTree[0];
      const result = analyzeBookmarkTree(rootNode, defaultOptions);

      expect(result).toHaveProperty('emptyFolders');
      expect(result).toHaveProperty('duplicateUrls');
      // errorPages는 이제 포함되지 않음

      expect(Array.isArray(result.emptyFolders)).toBe(true);
      expect(Array.isArray(result.duplicateUrls)).toBe(true);
    });

    it('should skip empty folder analysis when removeEmptyFolders is false', () => {
      const rootNode = mockBookmarkTree[0];
      const optionsWithoutEmptyFolders = {
        ...defaultOptions,
        removeEmptyFolders: false,
      };
      const result = analyzeBookmarkTree(rootNode, optionsWithoutEmptyFolders);

      expect(result.emptyFolders).toHaveLength(0);
      expect(result.duplicateUrls).toHaveLength(1); // 중복 스캔은 여전히 실행됨
    });

    it('should skip duplicate analysis when removeDuplicates is false', () => {
      const rootNode = mockBookmarkTree[0];
      const optionsWithoutDuplicates = {
        ...defaultOptions,
        removeDuplicates: false,
      };
      const result = analyzeBookmarkTree(rootNode, optionsWithoutDuplicates);

      expect(result.emptyFolders).toHaveLength(2); // 빈 폴더 스캔은 여전히 실행됨
      expect(result.duplicateUrls).toHaveLength(0);
    });

    it('should skip all analysis when all options are false', () => {
      const rootNode = mockBookmarkTree[0];
      const allOptionsOff = {
        ...defaultOptions,
        removeEmptyFolders: false,
        removeDuplicates: false,
        removeErrorPages: false,
      };
      const result = analyzeBookmarkTree(rootNode, allOptionsOff);

      expect(result.emptyFolders).toHaveLength(0);
      expect(result.duplicateUrls).toHaveLength(0);
    });
  });
});
