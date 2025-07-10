import { useState } from 'react';
import type { SelectableCleanupResult, CleanupOptions } from '@/types/bookmark';
import { chromeMessageService } from '@/services/chromeMessageService';
import { transformToSelectableResult } from '@/utils/dataTransformers';

export function useBookmarkScan() {
  const [selectableCleanupItems, setSelectableCleanupItems] =
    useState<SelectableCleanupResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const scan = async (cleanupOptions: CleanupOptions) => {
    setIsScanning(true);
    try {
      const scanResult = await chromeMessageService.requestScan(cleanupOptions);
      const selectableResult = transformToSelectableResult(scanResult);
      setSelectableCleanupItems(selectableResult);
    } catch (error) {
      console.error('Scan failed:', error);
      throw error;
    } finally {
      setIsScanning(false);
    }
  };

  const clearScanResults = () => {
    setSelectableCleanupItems(null);
  };

  return {
    selectableCleanupItems,
    isScanning,
    scan,
    clearScanResults,
    setSelectableCleanupItems,
  };
}
