import { useState } from 'react';

import { chromeMessageService } from '@/services/chromeMessageService';
import type { CleanupOptions, SelectableCleanupResult } from '@/types/bookmark';
import { saveCleanupHistory } from '@/utils/cleanupHistory';
import { filterCheckedItems } from '@/utils/dataTransformers';

const toMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export function useBookmarkCleanup() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanupError, setCleanupError] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  const cleanup = async (
    selectableCleanupItems: SelectableCleanupResult,
    cleanupOptions: CleanupOptions
  ) => {
    setIsProcessing(true);
    setCleanupError(null);
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
      setCleanupError(toMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const backup = async () => {
    setBackupError(null);
    try {
      return await chromeMessageService.requestBackup();
    } catch (error) {
      console.error('Backup failed:', error);
      setBackupError(toMessage(error));
    }
  };

  return {
    isProcessing,
    cleanupError,
    backupError,
    cleanup,
    backup,
    clearCleanupError: () => setCleanupError(null),
  };
}
