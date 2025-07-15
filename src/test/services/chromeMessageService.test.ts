import { beforeEach, describe, expect, it } from 'vitest';

import { ChromeMessageService } from '@/services/chromeMessageService.ts';

import { mockChrome, resetChromeMock, setupChromeMock } from '../mocks/chrome';

describe('ChromeMessageService', () => {
  let chromeMessageService: ChromeMessageService;

  beforeEach(() => {
    setupChromeMock();
    resetChromeMock();
    chromeMessageService = new ChromeMessageService();
  });

  describe('requestScan', () => {
    it('should send scan message and return result', async () => {
      const mockResult = {
        emptyFolders: [],
        duplicateUrls: [],
        errorPages: [],
      };

      mockChrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        result: mockResult,
      });

      const result = await chromeMessageService.requestScan();

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'scan',
      });

      expect(result).toEqual(mockResult);
    });

    it('should throw error when scan fails', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue({
        success: false,
      });

      await expect(chromeMessageService.requestScan()).rejects.toThrow(
        'Scan failed'
      );
    });
  });

  describe('requestCleanup', () => {
    it('should send cleanup message and return stats', async () => {
      const mockItems = {
        emptyFolders: [{ id: '1', isChecked: true }],
        duplicateUrls: [],
        errorPages: [],
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

      mockChrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        stats: mockStats,
        updatedResult: mockUpdatedResult,
      });

      const result = await chromeMessageService.requestCleanup(mockItems);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'cleanup',
        items: mockItems,
      });

      expect(result.stats).toEqual(mockStats);
      expect(result.updatedResult).toEqual(mockUpdatedResult);
    });

    it('should throw error when cleanup fails', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue({
        success: false,
      });

      const mockItems = {
        emptyFolders: [],
        duplicateUrls: [],
        errorPages: [],
      };

      await expect(
        chromeMessageService.requestCleanup(mockItems)
      ).rejects.toThrow('Cleanup failed');
    });
  });

  describe('requestBackup', () => {
    it('should send backup message and return backup data', async () => {
      const mockBackupData = '{"version": 1, "bookmarks": []}';

      mockChrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        backupData: mockBackupData,
      });

      const result = await chromeMessageService.requestBackup();

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'backup',
      });

      expect(result).toBe(mockBackupData);
    });

    it('should throw error when backup fails', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue({
        success: false,
      });

      await expect(chromeMessageService.requestBackup()).rejects.toThrow(
        'Backup failed'
      );
    });
  });

  describe('error handling', () => {
    it('should handle chrome.runtime.sendMessage rejection', async () => {
      mockChrome.runtime.sendMessage.mockRejectedValue(
        new Error('Network error')
      );

      await expect(chromeMessageService.requestScan()).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle invalid response format', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(null);

      await expect(chromeMessageService.requestScan()).rejects.toThrow();
    });
  });
});
