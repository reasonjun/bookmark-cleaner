import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BookmarkService } from '@/services/bookmarkService';
import type { CleanupOptions } from '@/types/bookmark';

import { mockChrome, resetChromeMock, setupChromeMock } from '../mocks/chrome';

// Private 메서드 접근을 위한 헬퍼 함수
function getPrivateMethod<T>(obj: object, methodName: string): T {
  // 객체 자체 또는 프로토타입 체인에서 메서드 찾기
  let current = obj;
  while (current) {
    if (Object.prototype.hasOwnProperty.call(current, methodName)) {
      const descriptor = Object.getOwnPropertyDescriptor(current, methodName);
      const method = descriptor?.value;
      if (typeof method === 'function') {
        return method as T;
      }
    }
    current = Object.getPrototypeOf(current);
  }
  throw new Error(
    `Method ${methodName} not found in object or prototype chain`
  );
}

describe('BookmarkService', () => {
  let bookmarkService: BookmarkService;

  const defaultOptions: CleanupOptions = {
    removeEmptyFolders: true,
    removeDuplicates: true,
    removeErrorPages: true,
  };

  beforeEach(() => {
    setupChromeMock();
    resetChromeMock();
    bookmarkService = new BookmarkService();
  });

  describe('getBookmarkTree', () => {
    it('should call chrome.bookmarks.getTree', async () => {
      await bookmarkService.getBookmarkTree();

      expect(mockChrome.bookmarks.getTree).toHaveBeenCalled();
    });

    it('should return bookmark tree', async () => {
      const result = await bookmarkService.getBookmarkTree();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('scanBookmarks', () => {
    it('should return analyzed bookmark tree', async () => {
      const result = await bookmarkService.scanBookmarks(defaultOptions);

      expect(result).toHaveProperty('emptyFolders');
      expect(result).toHaveProperty('duplicateUrls');
      expect(result).toHaveProperty('errorPages');

      expect(Array.isArray(result.emptyFolders)).toBe(true);
      expect(Array.isArray(result.duplicateUrls)).toBe(true);
      expect(Array.isArray(result.errorPages)).toBe(true);
    });

    it('should find empty folders and duplicates', async () => {
      const result = await bookmarkService.scanBookmarks(defaultOptions);

      expect(result.emptyFolders.length).toBeGreaterThan(0);
      expect(result.duplicateUrls.length).toBeGreaterThan(0);
    });

    it('should skip error page check when removeErrorPages is false', async () => {
      const optionsWithoutErrorPages = {
        ...defaultOptions,
        removeErrorPages: false,
      };
      const result = await bookmarkService.scanBookmarks(
        optionsWithoutErrorPages
      );

      expect(result.errorPages).toHaveLength(0);
    });

    it('should skip empty folder scan when removeEmptyFolders is false', async () => {
      const optionsWithoutEmptyFolders = {
        ...defaultOptions,
        removeEmptyFolders: false,
      };
      const result = await bookmarkService.scanBookmarks(
        optionsWithoutEmptyFolders
      );

      expect(result.emptyFolders).toHaveLength(0);
      expect(result.duplicateUrls.length).toBeGreaterThan(0); // 중복 스캔은 여전히 실행됨
    });

    it('should skip duplicate scan when removeDuplicates is false', async () => {
      const optionsWithoutDuplicates = {
        ...defaultOptions,
        removeDuplicates: false,
      };
      const result = await bookmarkService.scanBookmarks(
        optionsWithoutDuplicates
      );

      expect(result.duplicateUrls).toHaveLength(0);
      expect(result.emptyFolders.length).toBeGreaterThan(0); // 빈 폴더 스캔은 여전히 실행됨
    });
  });

  describe('checkUrlStatus', () => {
    it('should return accessible true for successful HEAD request', async () => {
      // Mock fetch to succeed for HEAD request
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await bookmarkService.checkUrlStatus('https://google.com');

      expect(result.accessible).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('https://google.com', {
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache',
        signal: expect.any(AbortSignal),
      });
    });

    it('should return accessible false for 400 status codes', async () => {
      // Mock fetch to return 404
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await bookmarkService.checkUrlStatus(
        'https://notfound.com'
      );

      expect(result.accessible).toBe(false);
      expect(result.errorCode).toBe(404);
    });

    it('should return accessible false for 500 status codes', async () => {
      // Mock fetch to return 500
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await bookmarkService.checkUrlStatus(
        'https://servererror.com'
      );

      expect(result.accessible).toBe(false);
      expect(result.errorCode).toBe(500);
    });

    it('should return accessible true for 3xx status codes', async () => {
      // Mock fetch to return 301
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 301,
      });

      const result = await bookmarkService.checkUrlStatus(
        'https://redirect.com'
      );

      expect(result.accessible).toBe(true);
    });

    it('should fallback to GET + CORS when HEAD fails', async () => {
      // Mock fetch to fail for HEAD, succeed for GET
      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('Method not allowed'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        });

      const result = await bookmarkService.checkUrlStatus(
        'https://noheadsite.com'
      );

      expect(result.accessible).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        'https://noheadsite.com',
        {
          method: 'HEAD',
          mode: 'cors',
          cache: 'no-cache',
          signal: expect.any(AbortSignal),
        }
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'https://noheadsite.com',
        {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          signal: expect.any(AbortSignal),
        }
      );
    });

    it('should fallback to GET + no-cors when CORS fails', async () => {
      // Mock fetch to fail for HEAD and GET with CORS, succeed with no-cors
      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('CORS error'))
        .mockRejectedValueOnce(new Error('CORS error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 0, // no-cors mode returns 0
        });

      const result = await bookmarkService.checkUrlStatus(
        'https://corssite.com'
      );

      expect(result.accessible).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenNthCalledWith(3, 'https://corssite.com', {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: expect.any(AbortSignal),
      });
    });

    it('should return accessible false when all methods fail', async () => {
      // Mock fetch to fail for all methods
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await bookmarkService.checkUrlStatus(
        'https://nonexistent.com'
      );

      expect(result.accessible).toBe(false);
      expect(result.errorCode).toBe(0);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle GET request with error status code', async () => {
      // Mock fetch to fail for HEAD, return 404 for GET
      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('HEAD failed'))
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      const result = await bookmarkService.checkUrlStatus(
        'https://notfound.com'
      );

      expect(result.accessible).toBe(false);
      expect(result.errorCode).toBe(404);
    });
  });

  describe('removeBookmark', () => {
    it('should call chrome.bookmarks.remove', async () => {
      await bookmarkService.removeBookmark('123');

      expect(mockChrome.bookmarks.remove).toHaveBeenCalledWith(
        '123',
        expect.any(Function)
      );
    });
  });

  describe('removeBookmarkFolder', () => {
    it('should call chrome.bookmarks.removeTree', async () => {
      await bookmarkService.removeBookmarkFolder('123');

      expect(mockChrome.bookmarks.removeTree).toHaveBeenCalledWith(
        '123',
        expect.any(Function)
      );
    });
  });

  describe('createBackup', () => {
    it('should return JSON string of bookmark tree', async () => {
      const result = await bookmarkService.createBackup();

      expect(typeof result).toBe('string');
      expect(() => JSON.parse(result)).not.toThrow();

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
    });
  });

  describe('checkOfflineAndComplete', () => {
    it('should return true and call onProgress when offline', () => {
      // Mock navigator.onLine to be false
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
        configurable: true,
      });

      const mockOnProgress = vi.fn();
      const checkOfflineAndComplete = getPrivateMethod<
        (onProgress?: (progress: number) => void) => boolean
      >(bookmarkService, 'checkOfflineAndComplete');
      const result = checkOfflineAndComplete(mockOnProgress);

      expect(result).toBe(true);
      expect(mockOnProgress).toHaveBeenCalledWith(100);
    });

    it('should return false and not call onProgress when online', () => {
      // Mock navigator.onLine to be true
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
        configurable: true,
      });

      const mockOnProgress = vi.fn();
      const checkOfflineAndComplete = getPrivateMethod<
        (onProgress?: (progress: number) => void) => boolean
      >(bookmarkService, 'checkOfflineAndComplete');
      const result = checkOfflineAndComplete(mockOnProgress);

      expect(result).toBe(false);
      expect(mockOnProgress).not.toHaveBeenCalled();
    });

    it('should work without onProgress callback', () => {
      // Mock navigator.onLine to be false
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
        configurable: true,
      });

      const checkOfflineAndComplete = getPrivateMethod<
        (onProgress?: (progress: number) => void) => boolean
      >(bookmarkService, 'checkOfflineAndComplete');
      const result = checkOfflineAndComplete();

      expect(result).toBe(true);
    });
  });

  describe('findErrorPages', () => {
    beforeEach(() => {
      // Mock navigator.onLine to be true for findErrorPages tests
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
        configurable: true,
      });
    });

    it('should return empty array when offline', async () => {
      // Mock navigator.onLine to be false
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
        configurable: true,
      });

      const mockOnProgress = vi.fn();
      const result = await bookmarkService.findErrorPages([], mockOnProgress);

      expect(result).toEqual([]);
      expect(mockOnProgress).toHaveBeenCalledWith(100);
    });

    it('should stop processing when going offline mid-execution', async () => {
      const mockBookmarks = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Bookmark ${i + 1}`,
        url: `https://example${i + 1}.com`,
      }));

      vi.spyOn(bookmarkService, 'checkUrlStatus').mockResolvedValue({
        accessible: true,
      });

      // Mock navigator.onLine to go offline after first batch
      let checkCount = 0;
      delete (navigator as unknown as Record<string, unknown>).onLine;
      Object.defineProperty(navigator, 'onLine', {
        get: () => {
          checkCount++;
          // 첫 번째 체크(시작)는 온라인, 두 번째 체크(첫 배치 후)는 오프라인
          return checkCount <= 2; // 시작과 첫 번째 배치는 온라인
        },
        configurable: true,
      });

      const mockOnProgress = vi.fn();
      const result = await bookmarkService.findErrorPages(
        mockBookmarks as chrome.bookmarks.BookmarkTreeNode[],
        mockOnProgress
      );

      // Should process first batch (10 bookmarks) then stop
      expect(bookmarkService.checkUrlStatus).toHaveBeenCalledTimes(10);
      expect(mockOnProgress).toHaveBeenCalledWith(100); // Should complete progress
      expect(Array.isArray(result)).toBe(true);
    });

    it('should find error pages from provided bookmarks', async () => {
      const mockBookmarks = [
        {
          id: '1',
          title: 'Working Site',
          url: 'https://google.com',
        },
        {
          id: '2',
          title: 'Error Site',
          url: 'https://nonexistent.com',
        },
      ];

      // Mock checkUrlStatus to return error for specific URL
      vi.spyOn(bookmarkService, 'checkUrlStatus').mockImplementation(
        async url => {
          if (url === 'https://nonexistent.com') {
            return { accessible: false, errorCode: 404 };
          }
          return { accessible: true };
        }
      );

      const result = await bookmarkService.findErrorPages(
        mockBookmarks as chrome.bookmarks.BookmarkTreeNode[]
      );

      expect(result).toHaveLength(1);
      expect(result[0].bookmark.url).toBe('https://nonexistent.com');
      expect(result[0].errorCode).toBe(404);
    });

    it('should extract bookmarks from tree when no bookmarks provided', async () => {
      vi.spyOn(bookmarkService, 'checkUrlStatus').mockResolvedValue({
        accessible: true,
      });

      const result = await bookmarkService.findErrorPages();

      expect(mockChrome.bookmarks.getTree).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should process bookmarks in batches', async () => {
      const mockBookmarks = Array.from({ length: 12 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Bookmark ${i + 1}`,
        url: `https://example${i + 1}.com`,
      }));

      vi.spyOn(bookmarkService, 'checkUrlStatus').mockResolvedValue({
        accessible: true,
      });

      await bookmarkService.findErrorPages(
        mockBookmarks as chrome.bookmarks.BookmarkTreeNode[]
      );

      // Should be called in batches of 10
      expect(bookmarkService.checkUrlStatus).toHaveBeenCalledTimes(12);
    });
  });
});
