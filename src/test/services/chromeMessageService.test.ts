import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChromeMessageService } from '@/services/chromeMessageService.ts';

import { mockChrome, resetChromeMock, setupChromeMock } from '../mocks/chrome';

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
});
