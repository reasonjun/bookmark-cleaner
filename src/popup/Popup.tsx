import { useEffect, useState } from 'react';
import { Button } from '@reasonjun/design-system-app';
import {
  CleanupControlPanel,
  ScanResultPanel,
  TabGroup,
  type TabItem,
} from '../components';
import type {
  CleanupOptions,
  CleanupStats,
  SelectableCleanupResult,
} from '../types/bookmark';
import './Popup.css';

export const Popup = () => {
  const [activeTab, setActiveTab] = useState('scan');
  const [selectableCleanupItems, setSelectableCleanupItems] =
    useState<SelectableCleanupResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanupOptions, setCleanupOptions] = useState<CleanupOptions>({
    removeEmptyFolders: true,
    removeDuplicates: true,
    removeErrorPages: true,
    checkHttpStatus: false,
  });
  const [lastCleanupStats, setLastCleanupStats] = useState<CleanupStats | null>(
    null
  );

  // 탭 변경 감지 및 스캔 탭 상태 초기화
  useEffect(() => {
    if (activeTab !== 'scan') {
      setSelectableCleanupItems(null);
      setIsScanning(false);
    }
  }, [activeTab]);

  // 정리 가능한 항목이 있는지 확인
  const isCleanupPossible = selectableCleanupItems
    ? selectableCleanupItems.emptyFolders.some(f => f.isChecked) ||
      selectableCleanupItems.duplicateUrls.some(d => d.isChecked) ||
      selectableCleanupItems.errorPages.some(e => e.isChecked)
    : false;

  // 선택된 항목의 총 개수 계산
  const checkedIssuesCount = selectableCleanupItems
    ? selectableCleanupItems.emptyFolders.filter(f => f.isChecked).length +
      selectableCleanupItems.duplicateUrls.filter(d => d.isChecked).length +
      selectableCleanupItems.errorPages.filter(e => e.isChecked).length
    : 0;

  const handleItemCheckChange = (
    category: keyof SelectableCleanupResult,
    id: string,
    isChecked: boolean
  ) => {
    if (!selectableCleanupItems) return;

    setSelectableCleanupItems(prevItems => {
      if (!prevItems) return null;

      const updatedCategory = prevItems[category].map((item: any) => {
        // DuplicateUrls는 bookmark.id가 아닌 url로 구분
        if (category === 'duplicateUrls') {
          return item.url === id ? { ...item, isChecked } : item;
        } else {
          return item.id === id ? { ...item, isChecked } : item;
        }
      });

      return {
        ...prevItems,
        [category]: updatedCategory,
      };
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
      const response = await chrome.runtime.sendMessage({ action: 'scan' });
      if (response.success) {
        // 스캔 결과를 선택 가능한 항목으로 변환하고 모두 기본적으로 체크
        const selectableResult: SelectableCleanupResult = {
          emptyFolders: response.result.emptyFolders.map((folder: any) => ({
            ...folder,
            isChecked: true,
          })),
          duplicateUrls: response.result.duplicateUrls.map((item: any) => ({
            ...item,
            isChecked: true,
          })),
          errorPages: response.result.errorPages.map((item: any) => ({
            ...item,
            isChecked: true,
          })),
        };
        setSelectableCleanupItems(selectableResult);
      }
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
      // 체크된 항목만 필터링하여 전송
      const itemsToCleanup = {
        emptyFolders: selectableCleanupItems.emptyFolders.filter(
          f => f.isChecked
        ),
        duplicateUrls: selectableCleanupItems.duplicateUrls.filter(
          d => d.isChecked
        ),
        errorPages: selectableCleanupItems.errorPages.filter(e => e.isChecked),
      };

      const response = await chrome.runtime.sendMessage({
        action: 'cleanup',
        items: itemsToCleanup,
      });
      if (response.success) {
        setLastCleanupStats(response.stats);
        // 정리 후 selectableCleanupItems도 업데이트
        const updatedSelectableResult: SelectableCleanupResult = {
          emptyFolders: response.updatedResult.emptyFolders.map(
            (folder: any) => ({ ...folder, isChecked: true })
          ),
          duplicateUrls: response.updatedResult.duplicateUrls.map(
            (item: any) => ({ ...item, isChecked: true })
          ),
          errorPages: response.updatedResult.errorPages.map((item: any) => ({
            ...item,
            isChecked: true,
          })),
        };
        setSelectableCleanupItems(updatedSelectableResult);
        setActiveTab('history');
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackup = async () => {
    if (!chrome.runtime?.id) return;

    try {
      const response = await chrome.runtime.sendMessage({ action: 'backup' });
      if (response.success) {
        // 백업 데이터를 다운로드
        const blob = new Blob([response.backupData], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookmark-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Backup failed:', error);
    }
  };

  const handleStartCleanupFromScanTab = () => {
    setActiveTab('settings');
  };

  return (
    <div className="popup">
      <header className="popup__header">
        <h1 className="popup__title">📚 BookmarkCleaner</h1>
        <p className="popup__subtitle">북마크를 깔끔하게 정리하세요</p>
      </header>

      <TabGroup
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        fullWidth
      />

      <main className="popup__content">
        {activeTab === 'scan' && (
          <div className="popup__tab-panel">
            <ScanResultPanel
              scanResult={selectableCleanupItems}
              isLoading={isScanning}
              onItemCheckChange={handleItemCheckChange}
            />
            <div className="popup__actions">
              {isScanning ? (
                <Button variant="primary" size="medium" disabled>
                  스캔 중...
                </Button>
              ) : selectableCleanupItems === null ? (
                <Button variant="primary" size="medium" onClick={handleScan}>
                  스캔
                </Button>
              ) : (
                <>
                  <p className="popup__selection-status">
                    {checkedIssuesCount > 0
                      ? `${checkedIssuesCount}개 선택됨`
                      : '아무것도 선택되지 않았습니다.'}
                  </p>
                  <Button
                    variant="primary"
                    size="medium"
                    onClick={handleStartCleanupFromScanTab}
                    disabled={checkedIssuesCount === 0}
                  >
                    정리 시작
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="popup__tab-panel">
            <CleanupControlPanel
              options={cleanupOptions}
              onOptionsChange={setCleanupOptions}
              onCleanup={handleCleanup}
              onBackup={handleBackup}
              isProcessing={isProcessing}
              isCleanupPossible={isCleanupPossible}
              initialCleanupStep={
                activeTab === 'settings' && checkedIssuesCount > 0
                  ? 'review'
                  : 'options'
              }
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="popup__tab-panel">
            {lastCleanupStats ? (
              <div className="popup__history">
                <h3>최근 정리 결과</h3>
                <ul className="popup__history-list">
                  <li>빈 폴더 {lastCleanupStats.emptyFoldersRemoved}개 제거</li>
                  <li>
                    중복 북마크 {lastCleanupStats.duplicatesRemoved}개 제거
                  </li>
                  <li>
                    에러 페이지 {lastCleanupStats.errorPagesRemoved}개 제거
                  </li>
                </ul>
                <p className="popup__history-total">
                  총 {lastCleanupStats.totalProcessed}개 항목 정리 완료
                </p>
              </div>
            ) : (
              <p className="popup__empty-message">아직 정리 기록이 없습니다.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
