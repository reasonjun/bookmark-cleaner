import { describe, it, expect, beforeEach } from 'vitest';
import {
  analyzeBookmarkTree,
  findEmptyFolders,
  findDuplicateUrls,
  extractAllBookmarks,
} from '../../utils/bookmarkAnalyzer';
import type { CleanupOptions } from '../../types/bookmark';
import {
  mockBookmarkTree,
  setupChromeMock,
  resetChromeMock,
} from '../mocks/chrome';

describe('bookmarkAnalyzer', () => {
  const defaultOptions: CleanupOptions = {
    removeEmptyFolders: true,
    removeDuplicates: true,
    removeErrorPages: true,
    checkHttpStatus: false,
    emptyFolderIncludesSubfolders: false,
  };

  beforeEach(() => {
    setupChromeMock();
    resetChromeMock();
  });

  describe('findEmptyFolders', () => {
    it('should find empty folders (default behavior)', () => {
      const rootNode = mockBookmarkTree[0];
      const emptyFolders = findEmptyFolders(rootNode, defaultOptions);

      expect(emptyFolders).toHaveLength(2);
      expect(emptyFolders[0].title).toBe('Empty Folder');
      expect(emptyFolders[1].title).toBe('Another Empty Folder');
    });

    it('should find folders with only subfolders when emptyFolderIncludesSubfolders is true', () => {
      const rootNode = mockBookmarkTree[0];
      const optionsWithSubfolders = {
        ...defaultOptions,
        emptyFolderIncludesSubfolders: true,
      };
      const emptyFolders = findEmptyFolders(rootNode, optionsWithSubfolders);

      // 하위 폴더만 있고 실제 북마크가 없는 폴더도 포함되어야 함
      expect(emptyFolders.length).toBeGreaterThanOrEqual(2);
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
        defaultOptions
      );
      expect(emptyFolders).toHaveLength(0);
    });

    it('should not include folders with children when emptyFolderIncludesSubfolders is false', () => {
      const rootNode = mockBookmarkTree[0];
      const emptyFolders = findEmptyFolders(rootNode, defaultOptions);

      const folderTitles = emptyFolders.map(f => f.title);
      expect(folderTitles).not.toContain('Bookmarks Bar');
      expect(folderTitles).not.toContain('Other Bookmarks');
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
      expect(result.errorPages).toHaveLength(0); // 이 함수에서는 errorPages를 분석하지 않음
    });

    it('should analyze with emptyFolderIncludesSubfolders option', () => {
      const rootNode = mockBookmarkTree[0];
      const optionsWithSubfolders = {
        ...defaultOptions,
        emptyFolderIncludesSubfolders: true,
      };
      const result = analyzeBookmarkTree(rootNode, optionsWithSubfolders);

      expect(result.emptyFolders.length).toBeGreaterThanOrEqual(2);
      expect(result.duplicateUrls).toHaveLength(1);
      expect(result.errorPages).toHaveLength(0);
    });

    it('should return proper structure', () => {
      const rootNode = mockBookmarkTree[0];
      const result = analyzeBookmarkTree(rootNode, defaultOptions);

      expect(result).toHaveProperty('emptyFolders');
      expect(result).toHaveProperty('duplicateUrls');
      expect(result).toHaveProperty('errorPages');

      expect(Array.isArray(result.emptyFolders)).toBe(true);
      expect(Array.isArray(result.duplicateUrls)).toBe(true);
      expect(Array.isArray(result.errorPages)).toBe(true);
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
      expect(result.errorPages).toHaveLength(0);
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
      expect(result.errorPages).toHaveLength(0);
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
      expect(result.errorPages).toHaveLength(0);
    });
  });
});
