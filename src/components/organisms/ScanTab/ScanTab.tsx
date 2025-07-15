import './ScanTab.css';

import { Button } from '@reasonjun/design-system-app';

import type { SelectableCleanupResult } from '@/types/bookmark';
import type { SelectableItemUnion } from '@/types/components';
import { getCheckboxState, getItemId } from '@/utils/itemHelpers';

import {
  CategorySection,
  ErrorPagesSection,
  ScanResultEmpty,
  ScanResultError,
  ScanResultLoading,
} from './components';

interface ScanTabProps {
  selectableCleanupItems: SelectableCleanupResult | null;
  isScanning: boolean;
  scanProgress?: number;
  error?: string;
  checkedIssuesCount: number;
  onScan: () => void;
  onCleanup: () => void;
  onItemCheckChange: (
    category: keyof SelectableCleanupResult,
    id: string,
    isChecked: boolean
  ) => void;
}

export const ScanTab = ({
  selectableCleanupItems,
  isScanning,
  scanProgress,
  error,
  checkedIssuesCount,
  onScan,
  onCleanup,
  onItemCheckChange,
}: ScanTabProps) => {
  const handleSelectAll = (
    category: keyof SelectableCleanupResult,
    checked: boolean
  ) => {
    if (!selectableCleanupItems) return;
    (
      selectableCleanupItems[
        category as keyof typeof selectableCleanupItems
      ] as SelectableItemUnion[]
    ).forEach((item: SelectableItemUnion) => {
      const id = getItemId(item, category);
      onItemCheckChange(category, id, checked);
    });
  };

  const ScanResultPanel = () => {
    if (error) {
      return <ScanResultError error={error} />;
    }

    if (isScanning) {
      return <ScanResultLoading scanProgress={scanProgress} />;
    }

    if (!selectableCleanupItems) {
      return <ScanResultEmpty />;
    }

    const totalIssues =
      selectableCleanupItems.emptyFolders.length +
      selectableCleanupItems.duplicateUrls.length +
      selectableCleanupItems.errorPages.length;

    const emptyFoldersCheckboxState = getCheckboxState(
      selectableCleanupItems.emptyFolders
    );
    const duplicateUrlsCheckboxState = getCheckboxState(
      selectableCleanupItems.duplicateUrls
    );
    const errorPagesCheckboxState = getCheckboxState(
      selectableCleanupItems.errorPages
    );

    return (
      <div className="scan-result-panel">
        <div className="scan-result-panel__summary" aria-live="polite">
          <h2 className="scan-result-panel__title">스캔 결과</h2>
          <p className="scan-result-panel__subtitle">
            총 {totalIssues}개의 정리 가능한 항목을 발견했습니다.
          </p>
        </div>

        <div className="scan-result-panel__cards">
          <CategorySection
            title="빈 폴더"
            items={selectableCleanupItems.emptyFolders}
            category="emptyFolders"
            allChecked={emptyFoldersCheckboxState.allChecked}
            someChecked={emptyFoldersCheckboxState.someChecked}
            onSelectAllChange={checked =>
              handleSelectAll('emptyFolders', checked)
            }
            onItemCheckChange={onItemCheckChange}
            renderItem={item => {
              const folder =
                item as SelectableCleanupResult['emptyFolders'][number];
              return folder.title || '(제목 없음)';
            }}
          />

          <CategorySection
            title="중복 URL"
            items={selectableCleanupItems.duplicateUrls}
            category="duplicateUrls"
            allChecked={duplicateUrlsCheckboxState.allChecked}
            someChecked={duplicateUrlsCheckboxState.someChecked}
            onSelectAllChange={checked =>
              handleSelectAll('duplicateUrls', checked)
            }
            onItemCheckChange={onItemCheckChange}
            renderItem={item => {
              const duplicateItem =
                item as SelectableCleanupResult['duplicateUrls'][number];
              return (
                <>
                  <a
                    href={duplicateItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    aria-label={`${duplicateItem.bookmarks[0]?.title || duplicateItem.url} (새 창에서 열림)`}
                  >
                    {duplicateItem.bookmarks[0]?.title || duplicateItem.url}
                  </a>
                  ({duplicateItem.bookmarks.length}개)
                </>
              );
            }}
          />

          <ErrorPagesSection
            errorPages={selectableCleanupItems.errorPages}
            allChecked={errorPagesCheckboxState.allChecked}
            someChecked={errorPagesCheckboxState.someChecked}
            onSelectAllChange={checked =>
              handleSelectAll('errorPages', checked)
            }
            onItemCheckChange={onItemCheckChange}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {ScanResultPanel()}
      <div className="main__actions">
        {!isScanning && !selectableCleanupItems && (
          <Button variant="primary" size="medium" onClick={onScan}>
            스캔
          </Button>
        )}

        {isScanning && (
          <Button variant="primary" size="medium" disabled>
            스캔 중...
          </Button>
        )}

        {!isScanning && selectableCleanupItems && (
          <>
            <p className="main__selection-status" role="status">
              {checkedIssuesCount > 0
                ? `${checkedIssuesCount}개 선택됨`
                : '아무것도 선택되지 않았습니다.'}
            </p>
            <Button
              variant="primary"
              size="medium"
              onClick={onCleanup}
              disabled={checkedIssuesCount === 0}
            >
              정리 시작
            </Button>
          </>
        )}
      </div>
    </>
  );
};
