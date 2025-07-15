import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CleanupHistory, CleanupStats } from '@/types/bookmark';
import { getCleanupHistory, saveCleanupHistory } from '@/utils/cleanupHistory';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock global objects
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock console.error
const mockConsoleError = vi
  .spyOn(console, 'error')
  .mockImplementation(() => {});

describe('cleanupHistory', () => {
  const mockStats1: CleanupStats = {
    emptyFoldersRemoved: 2,
    duplicatesRemoved: 3,
    errorPagesRemoved: 1,
    totalProcessed: 6,
  };

  const mockStats2: CleanupStats = {
    emptyFoldersRemoved: 1,
    duplicatesRemoved: 2,
    errorPagesRemoved: 0,
    totalProcessed: 3,
  };

  const mockHistory: CleanupHistory[] = [
    {
      timestamp: 1640995200000, // 2022-01-01 00:00:00
      stats: mockStats1,
    },
    {
      timestamp: 1640908800000, // 2021-12-31 00:00:00
      stats: mockStats2,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    mockConsoleError.mockClear();
  });

  describe('getCleanupHistory', () => {
    it('should return parsed history from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      const result = getCleanupHistory();

      expect(result).toEqual(mockHistory);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('cleanupHistory');
    });

    it('should return empty array if no history exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = getCleanupHistory();

      expect(result).toEqual([]);
    });

    it('should handle JSON parse errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const result = getCleanupHistory();

      expect(result).toEqual([]);
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to retrieve cleanup history:',
        expect.any(Error)
      );
    });
  });

  describe('saveCleanupHistory', () => {
    it('should save new history entry to localStorage', () => {
      const existingHistory = [mockHistory[1]];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingHistory));

      const mockDate = new Date('2022-01-01T00:00:00Z');
      vi.setSystemTime(mockDate);

      saveCleanupHistory(mockStats1);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cleanupHistory',
        JSON.stringify([
          {
            timestamp: mockDate.getTime(),
            stats: mockStats1,
          },
          ...existingHistory,
        ])
      );

      vi.useRealTimers();
    });

    it('should save to empty history when no existing history', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const mockDate = new Date('2022-01-01T00:00:00Z');
      vi.setSystemTime(mockDate);

      saveCleanupHistory(mockStats1);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cleanupHistory',
        JSON.stringify([
          {
            timestamp: mockDate.getTime(),
            stats: mockStats1,
          },
        ])
      );

      vi.useRealTimers();
    });

    it('should handle save errors', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => saveCleanupHistory(mockStats1)).toThrow('Storage error');
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to save cleanup history:',
        expect.any(Error)
      );
    });

    it('should handle get history errors during save', () => {
      // Reset the setItem mock to avoid interference from previous test
      localStorageMock.setItem.mockReset();
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const mockDate = new Date('2022-01-01T00:00:00Z');
      vi.setSystemTime(mockDate);

      saveCleanupHistory(mockStats1);

      // Should still save with empty history as fallback since getCleanupHistory handles errors gracefully
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cleanupHistory',
        JSON.stringify([
          {
            timestamp: mockDate.getTime(),
            stats: mockStats1,
          },
        ])
      );

      vi.useRealTimers();
    });
  });
});
