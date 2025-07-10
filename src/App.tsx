import { useEffect, useState } from 'react';
import { TabGroup, type TabItem } from '@/components';
import { ScanTab } from '@/components/organisms/ScanTab';
import { SettingsTab } from '@/components/organisms/SettingsTab';
import { HistoryTab } from '@/components/organisms/HistoryTab';
import type { CleanupOptions, SelectableCleanupResult } from '@/types/bookmark';
import { chromeMessageService } from '@/services/chromeMessageService';
import {
  transformToSelectableResult,
  filterCheckedItems,
  calculateCheckedCount,
  updateItemCheckState,
} from '@/utils/dataTransformers';
import { downloadBackupFile } from '@/utils/fileDownloader';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('scan');
  const [selectableCleanupItems, setSelectableCleanupItems] =
    useState<SelectableCleanupResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanupOptions, setCleanupOptions] = useState<CleanupOptions>({
    removeEmptyFolders: true,
    removeDuplicates: true,
    removeErrorPages: true,
  });

  // 탭 변경 감지 및 스캔 탭 상태 초기화
  useEffect(() => {
    if (activeTab !== 'scan') {
      setSelectableCleanupItems(null);
      setIsScanning(false);
    }
  }, [activeTab]);

  // 선택된 항목의 총 개수 계산
  const checkedIssuesCount = calculateCheckedCount(selectableCleanupItems);

  const handleItemCheckChange = (
    category: keyof SelectableCleanupResult,
    id: string,
    isChecked: boolean
  ) => {
    if (!selectableCleanupItems) return;

    setSelectableCleanupItems(prevItems => {
      if (!prevItems) return null;
      return updateItemCheckState(prevItems, category, id, isChecked);
    });
  };

  const tabs: TabItem[] = [
    { id: 'scan', label: '스캔' },
    { id: 'settings', label: '설정' },
    { id: 'history', label: '기록' },
  ];

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const scanResult = await chromeMessageService.requestScan(cleanupOptions);
      const selectableResult = transformToSelectableResult(scanResult);
      setSelectableCleanupItems(selectableResult);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCleanup = async () => {
    if (!selectableCleanupItems) return;

    setIsProcessing(true);
    try {
      const itemsToCleanup = filterCheckedItems(selectableCleanupItems);
      const { stats } = await chromeMessageService.requestCleanup(
        itemsToCleanup,
        cleanupOptions
      );

      // localStorage에 정리 결과 저장
      localStorage.setItem('lastCleanupStats', JSON.stringify(stats));
      setSelectableCleanupItems(null);
      setActiveTab('history');
    } catch (error) {
      console.error('Cleanup failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackup = async () => {
    if (!chrome.runtime?.id) return;

    try {
      const backupData = await chromeMessageService.requestBackup();
      downloadBackupFile(backupData);
    } catch (error) {
      console.error('Backup failed:', error);
    }
  };

  return (
    <main className="main">
      <header className="main__header">
        <h1 className="main__title">📚 BookmarkCleaner</h1>
        <p className="main__subtitle">북마크를 깔끔하게 정리하세요</p>
      </header>

      <TabGroup
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        fullWidth
      />

      <div className="main__content">
        <div className="main__tab-panel">
          {activeTab === 'scan' && (
            <ScanTab
              selectableCleanupItems={selectableCleanupItems}
              isScanning={isScanning}
              checkedIssuesCount={checkedIssuesCount}
              onScan={handleScan}
              onCleanup={handleCleanup}
              onItemCheckChange={handleItemCheckChange}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              options={cleanupOptions}
              onOptionsChange={setCleanupOptions}
              onBackup={handleBackup}
              isProcessing={isProcessing}
            />
          )}

          {activeTab === 'history' && <HistoryTab />}
        </div>
      </div>
    </main>
  );
}

export default App;
