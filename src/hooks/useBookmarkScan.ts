import { useEffect, useState } from 'react';

import { chromeMessageService } from '@/services/chromeMessageService';
import type { CleanupOptions, SelectableCleanupResult } from '@/types/bookmark';
import type { ScanProgressMessage } from '@/types/chrome';
import { transformToSelectableResult } from '@/utils/dataTransformers';

export function useBookmarkScan() {
  const [selectableCleanupItems, setSelectableCleanupItems] =
    useState<SelectableCleanupResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // 진행률 메시지 리스너 설정
  useEffect(() => {
    if (typeof chrome === 'undefined') {
      return;
    }

    const handleMessage = (message: ScanProgressMessage) => {
      if (message.action === 'scan_progress') {
        setScanProgress(message.progress);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const scan = async (cleanupOptions: CleanupOptions) => {
    setIsScanning(true);
    setScanProgress(0);

    try {
      const scanResult = await chromeMessageService.requestScan(cleanupOptions);
      const selectableResult = transformToSelectableResult(scanResult);
      setSelectableCleanupItems(selectableResult);
      setScanProgress(100);
    } catch (error) {
      console.error('Scan failed:', error);
      throw error;
    } finally {
      setIsScanning(false);
    }
  };

  const clearScanResults = () => {
    setSelectableCleanupItems(null);
    setScanProgress(0);
  };

  return {
    selectableCleanupItems,
    isScanning,
    scanProgress,
    scan,
    clearScanResults,
    setSelectableCleanupItems,
  };
}
