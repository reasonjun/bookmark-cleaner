import { useEffect, useState } from 'react';
import { TabGroup } from '@/components';
import { ScanTab } from '@/components/organisms/ScanTab';
import { SettingsTab } from '@/components/organisms/SettingsTab';
import { HistoryTab } from '@/components/organisms/HistoryTab';
import type { CleanupOptions, SelectableCleanupResult } from '@/types/bookmark';
import { useBookmarkCleanup, useBookmarkScan, useTabNavigation } from '@/hooks';
import { APP_TABS, DEFAULT_CLEANUP_OPTIONS } from '@/constants';
import {
  calculateCheckedCount,
  updateItemCheckState,
} from '@/utils/dataTransformers';
import { downloadBackupFile } from '@/utils/fileDownloader';
import './index.css';

function App() {
  const { activeTab, setActiveTab, switchToTab } = useTabNavigation();
  const {
    selectableCleanupItems,
    isScanning,
    scan,
    clearScanResults,
    setSelectableCleanupItems,
  } = useBookmarkScan();
  const { isProcessing, cleanup, backup } = useBookmarkCleanup();
  const [cleanupOptions, setCleanupOptions] = useState<CleanupOptions>(
    DEFAULT_CLEANUP_OPTIONS
  );

  // 탭 변경 감지 및 스캔 탭 상태 초기화
  useEffect(() => {
    if (activeTab !== 'scan') {
      clearScanResults();
    }
  }, [activeTab, clearScanResults]);

  // 선택된 항목의 총 개수 계산
  const checkedIssuesCount = calculateCheckedCount(selectableCleanupItems);

  const handleItemCheckChange = (
    category: keyof SelectableCleanupResult,
    id: string,
    isChecked: boolean
  ) => {
    if (!selectableCleanupItems) {
      return;
    }

    setSelectableCleanupItems(prevItems => {
      if (!prevItems) {
        return null;
      }
      return updateItemCheckState(prevItems, category, id, isChecked);
    });
  };

  const handleScan = async () => {
    await scan(cleanupOptions);
  };

  const handleCleanup = async () => {
    if (!selectableCleanupItems) return;

    await cleanup(selectableCleanupItems, cleanupOptions);
    clearScanResults();
    switchToTab('history');
  };

  const handleBackup = async () => {
    const backupData = await backup();

    if (backupData) {
      downloadBackupFile(backupData);
    }
  };

  return (
    <main className="main">
      <header className="main__header">
        <h1 className="main__title">📚 Bookmark Cleaner</h1>
        <p className="main__subtitle">북마크를 깔끔하게 정리하세요</p>
      </header>

      <TabGroup
        tabs={APP_TABS}
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
