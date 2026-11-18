import { useEffect, useState } from 'react';

import { chromeMessageService } from '@/services/chromeMessageService';
import type { CleanupOptions, SelectableCleanupResult } from '@/types/bookmark';
import { transformToSelectableResult } from '@/utils/dataTransformers';

export function useBookmarkScan() {
  const [selectableCleanupItems, setSelectableCleanupItems] =
    useState<SelectableCleanupResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);

  // 진행률 메시지 리스너 설정
  useEffect(() => chromeMessageService.onScanProgress(setScanProgress), []);

  const scan = async (cleanupOptions: CleanupOptions) => {
    setIsScanning(true);
    setScanProgress(0);
    setScanError(null);

    try {
      const scanResult = await chromeMessageService.requestScan(cleanupOptions);
      const selectableResult = transformToSelectableResult(scanResult);
      setSelectableCleanupItems(selectableResult);
      setScanProgress(100);
    } catch (error) {
      console.error('Scan failed:', error);
      setScanError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsScanning(false);
    }
  };

  const clearScanResults = () => {
    setSelectableCleanupItems(null);
    setScanProgress(0);
    setScanError(null);
  };

  return {
    selectableCleanupItems,
    isScanning,
    scanProgress,
    scanError,
    scan,
    clearScanResults,
    setSelectableCleanupItems,
  };
}
