import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChromeMessageService } from '@/services/chromeMessageService.ts';

import { mockChrome, resetChromeMock, setupChromeMock } from '../mocks/chrome';

const noop = () => {};

describe('ChromeMessageService', () => {
  let chromeMessageService: ChromeMessageService;

  beforeEach(() => {
    setupChromeMock();
    resetChromeMock();
    chromeMessageService = new ChromeMessageService();
  });

  afterEach(() => {
    mockChrome.runtime.lastError = undefined;
  });

  describe('requestScan', () => {
    it('should send scan message and return result', async () => {
      const mockOptions = {
        removeEmptyFolders: true,
        removeDuplicates: true,
        removeErrorPages: true,
      };

      const mockResult = {
        emptyFolders: [],
        duplicateUrls: [],
        errorPages: [],
      };

      mockChrome.runtime.sendMessage.mockImplementation((_, callback) => {
        callback({
          success: true,
          result: mockResult,
        });
      });

      const result = await chromeMessageService.requestScan(mockOptions);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        {
          action: 'scan',
          options: mockOptions,
        },
        expect.any(Function)
      );

      expect(result).toEqual(mockResult);
    });

    it('should throw error when scan fails', async () => {
      const mockOptions = {
        removeEmptyFolders: true,
        removeDuplicates: true,
        removeErrorPages: true,
      };

      mockChrome.runtime.sendMessage.mockImplementation((_, callback) => {
        callback({
          success: false,
        });
      });

      await expect(
        chromeMessageService.requestScan(mockOptions)
      ).rejects.toThrow('Scan failed');
    });
  });

  describe('requestCleanup', () => {
    it('should send cleanup message and return stats', async () => {
      const mockItems = {
        emptyFolders: [
          {
            id: '1',
            title: 'Empty Folder',
            syncing: false,
            isChecked: true,
          },
        ],
        duplicateUrls: [],
        errorPages: [],
      };

      const mockOptions = {
        removeEmptyFolders: true,
        removeDuplicates: true,
        removeErrorPages: true,
      };

      const mockStats = {
        emptyFoldersRemoved: 1,
        duplicatesRemoved: 0,
        errorPagesRemoved: 0,
        totalProcessed: 1,
      };

      const mockUpdatedResult = {
        emptyFolders: [],
        duplicateUrls: [],
        errorPages: [],
      };

      mockChrome.runtime.sendMessage.mockImplementation((_, callback) => {
        callback({
          success: true,
          stats: mockStats,
          updatedResult: mockUpdatedResult,
        });
      });

      const result = await chromeMessageService.requestCleanup(
        mockItems,
        mockOptions
      );

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        {
          action: 'cleanup',
          items: mockItems,
          options: mockOptions,
        },
        expect.any(Function)
      );

      expect(result.stats).toEqual(mockStats);
      expect(result.updatedResult).toEqual(mockUpdatedResult);
    });

    it('should throw error when cleanup fails', async () => {
      const mockItems = {
        emptyFolders: [],
        duplicateUrls: [],
        errorPages: [],
      };

      const mockOptions = {
        removeEmptyFolders: true,
        removeDuplicates: true,
        removeErrorPages: true,
      };

      mockChrome.runtime.sendMessage.mockImplementation((_, callback) => {
        callback({
          success: false,
        });
      });

      await expect(
        chromeMessageService.requestCleanup(mockItems, mockOptions)
      ).rejects.toThrow('Cleanup failed');
    });
  });

  describe('requestBackup', () => {
    it('should send backup message and return backup data', async () => {
      const mockBackupData = '{"version": 1, "bookmarks": []}';

      mockChrome.runtime.sendMessage.mockImplementation((_, callback) => {
        callback({
          success: true,
          backupData: mockBackupData,
        });
      });

      const result = await chromeMessageService.requestBackup();

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        {
          action: 'backup',
        },
        expect.any(Function)
      );

      expect(result).toBe(mockBackupData);
    });

    it('should throw error when backup fails', async () => {
      mockChrome.runtime.sendMessage.mockImplementation((_, callback) => {
        callback({
          success: false,
        });
      });

      await expect(chromeMessageService.requestBackup()).rejects.toThrow(
        'Backup failed'
      );
    });
  });

  describe('error handling', () => {
    it('should handle chrome.runtime.lastError', async () => {
      const mockOptions = {
        removeEmptyFolders: true,
        removeDuplicates: true,
        removeErrorPages: true,
      };

      mockChrome.runtime.sendMessage.mockImplementation((_, callback) => {
        mockChrome.runtime.lastError = { message: 'Runtime error' };
        callback(null);
      });

      await expect(
        chromeMessageService.requestScan(mockOptions)
      ).rejects.toThrow('Runtime error');
    });

    it('should handle invalid response format', async () => {
      const mockOptions = {
        removeEmptyFolders: true,
        removeDuplicates: true,
        removeErrorPages: true,
      };

      mockChrome.runtime.sendMessage.mockImplementation((_, callback) => {
        callback(null);
      });

      await expect(
        chromeMessageService.requestScan(mockOptions)
      ).rejects.toThrow();
    });
  });

  describe('확장 프로그램 환경이 아닐 때', () => {
    beforeEach(() => {
      // 일반 Chrome 탭: chrome 객체는 있지만 runtime이 없다
      global.chrome = {} as typeof chrome;
    });

    it('requestScan은 알아볼 수 있는 에러로 거부한다', async () => {
      await expect(
        chromeMessageService.requestScan({
          removeEmptyFolders: true,
          removeDuplicates: true,
          removeErrorPages: true,
        })
      ).rejects.toThrow('확장 프로그램');
    });

    it('requestBackup은 알아볼 수 있는 에러로 거부한다', async () => {
      await expect(chromeMessageService.requestBackup()).rejects.toThrow(
        '확장 프로그램'
      );
    });

    it('onScanProgress는 에러 없이 해제 함수를 돌려준다', () => {
      const unsubscribe = chromeMessageService.onScanProgress(() => {});
      expect(() => unsubscribe()).not.toThrow();
    });

    it('웹 페이지용 runtime(sendMessage만 있고 id·onMessage 없음)도 확장 밖으로 본다', async () => {
      // externally_connectable 확장이 설치돼 있으면 일반 페이지에도 이런 runtime이 노출된다
      global.chrome = {
        runtime: { sendMessage: () => {} },
      } as unknown as typeof chrome;

      expect(() => chromeMessageService.onScanProgress(noop)).not.toThrow();
      await expect(chromeMessageService.requestBackup()).rejects.toThrow(
        '확장 프로그램'
      );
    });

    it('chrome 전역이 아예 없어도 알아볼 수 있는 에러로 거부한다', async () => {
      global.chrome = undefined as unknown as typeof chrome;

      expect(() => chromeMessageService.onScanProgress(noop)).not.toThrow();
      await expect(
        chromeMessageService.requestCleanup(
          {},
          {
            removeEmptyFolders: true,
            removeDuplicates: true,
            removeErrorPages: true,
          }
        )
      ).rejects.toThrow('확장 프로그램');
    });
  });

  describe('onScanProgress', () => {
    it('scan_progress 메시지의 진행률만 콜백에 전달하고 해제할 수 있다', () => {
      const progress: number[] = [];
      const unsubscribe = chromeMessageService.onScanProgress(p =>
        progress.push(p)
      );

      const listener =
        mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
      listener({ action: 'scan_progress', progress: 40 });
      listener({ action: 'other', progress: 99 });
      expect(progress).toEqual([40]);

      unsubscribe();
      expect(mockChrome.runtime.onMessage.removeListener).toHaveBeenCalledWith(
        listener
      );
    });
  });
});
