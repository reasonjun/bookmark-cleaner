import { useState } from 'react';
import type { CleanupOptions, SelectableCleanupResult } from '@/types/bookmark';
import { chromeMessageService } from '@/services/chromeMessageService';
import { filterCheckedItems } from '@/utils/dataTransformers';
import { saveCleanupHistory } from '@/utils/cleanupHistory';

export function useBookmarkCleanup() {
  const [isProcessing, setIsProcessing] = useState(false);

  const cleanup = async (
    selectableCleanupItems: SelectableCleanupResult,
    cleanupOptions: CleanupOptions
  ) => {
    setIsProcessing(true);
    try {
      const itemsToCleanup = filterCheckedItems(selectableCleanupItems);
      const { stats } = await chromeMessageService.requestCleanup(
        itemsToCleanup,
        cleanupOptions
      );

      // localStorage에 정리 결과 누적 저장
      saveCleanupHistory(stats);

      return stats;
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const backup = async () => {
    if (!chrome.runtime?.id) return;

    try {
      const backupData = await chromeMessageService.requestBackup();
      return backupData;
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  };

  return {
    isProcessing,
    cleanup,
    backup,
  };
}
