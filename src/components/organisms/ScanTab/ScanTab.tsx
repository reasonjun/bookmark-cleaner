import { Button, Checkbox } from '@reasonjun/design-system-app';
import { LoadingOverlay, CollapsibleSection, Section } from '@/components';
import { ProgressBar } from '../../atoms';
import type { SelectableCleanupResult } from '@/types/bookmark';
import type { SelectableItemUnion } from '@/types/components';
import { groupErrorPagesByCategory } from '@/utils/errorMessages';
import { ERROR_CATEGORY_ORDER } from '@/constants';
import './ScanTab.css';

// 아이콘 컴포넌트 (임시)
const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
);

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
  // Helper to calculate allChecked and someChecked for a category
  const getCheckboxState = (items: { isChecked: boolean }[]) => {
    const all = items.every(item => item.isChecked);
    const some = items.some(item => item.isChecked);
    return { allChecked: all, someChecked: some && !all };
  };

  const handleSelectAll = (
    category: keyof SelectableCleanupResult,
    checked: boolean
  ) => {
    if (!selectableCleanupItems) return;
    // Call onItemCheckChange for each item in the category
    selectableCleanupItems[category].forEach((item: SelectableItemUnion) => {
      // Use appropriate ID for each category
      const id =
        category === 'duplicateUrls'
          ? (item as SelectableCleanupResult['duplicateUrls'][number]).url
          : 'id' in item
            ? item.id
            : (item as SelectableCleanupResult['errorPages'][number]).bookmark
                .id;
      onItemCheckChange(category, id, checked);
    });
  };

  const ScanResultPanel = () => {
    if (error) {
      return (
        <div className="scan-result-panel scan-result-panel--error">
          <ErrorIcon />
          <p>{error}</p>
        </div>
      );
    }

    if (isScanning) {
      return (
        <div className="scan-result-panel">
          <LoadingOverlay
            visible={true}
            message="북마크를 스캔하는 중..."
            blur={false}
          />
          {scanProgress !== undefined && (
            <div className="scan-result-panel__progress">
              <ProgressBar
                value={scanProgress}
                variant="primary"
                animated
                striped
              />
              <span className="scan-result-panel__progress-text">
                {scanProgress}% 완료
              </span>
            </div>
          )}
        </div>
      );
    }

    if (!selectableCleanupItems) {
      return (
        <div className="scan-result-panel scan-result-panel--empty">
          <p>스캔 버튼을 클릭하여 북마크 정리를 시작하세요.</p>
        </div>
      );
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
        <div className="scan-result-panel__summary">
          <h2 className="scan-result-panel__title">스캔 결과</h2>
          <p className="scan-result-panel__subtitle">
            총 {totalIssues}개의 정리 가능한 항목을 발견했습니다.
          </p>
        </div>

        <div className="scan-result-panel__cards">
          {selectableCleanupItems.emptyFolders.length === 0 ? (
            <Section
              title="빈 폴더"
              count={selectableCleanupItems.emptyFolders.length}
              allChecked={emptyFoldersCheckboxState.allChecked}
              someChecked={emptyFoldersCheckboxState.someChecked}
              onSelectAllChange={checked =>
                handleSelectAll('emptyFolders', checked)
              }
              children={undefined}
            />
          ) : (
            <CollapsibleSection
              title="빈 폴더"
              count={selectableCleanupItems.emptyFolders.length}
              initialOpen={false}
              allChecked={emptyFoldersCheckboxState.allChecked}
              someChecked={emptyFoldersCheckboxState.someChecked}
              onSelectAllChange={checked =>
                handleSelectAll('emptyFolders', checked)
              }
            >
              <ul>
                {selectableCleanupItems.emptyFolders.map(folder => (
                  <li key={folder.id}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Checkbox
                        checked={folder.isChecked}
                        onChange={e =>
                          onItemCheckChange(
                            'emptyFolders',
                            folder.id,
                            e.target.checked
                          )
                        }
                      />
                      {folder.title || '(제목 없음)'}
                    </label>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {selectableCleanupItems.duplicateUrls.length === 0 ? (
            <Section
              title="중복 URL"
              count={selectableCleanupItems.duplicateUrls.length}
              allChecked={duplicateUrlsCheckboxState.allChecked}
              someChecked={duplicateUrlsCheckboxState.someChecked}
              onSelectAllChange={checked =>
                handleSelectAll('duplicateUrls', checked)
              }
              children={undefined}
            />
          ) : (
            <CollapsibleSection
              title="중복 URL"
              count={selectableCleanupItems.duplicateUrls.length}
              initialOpen={false}
              allChecked={duplicateUrlsCheckboxState.allChecked}
              someChecked={duplicateUrlsCheckboxState.someChecked}
              onSelectAllChange={checked =>
                handleSelectAll('duplicateUrls', checked)
              }
            >
              <ul>
                {selectableCleanupItems.duplicateUrls.map(item => (
                  <li key={item.url}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Checkbox
                        checked={item.isChecked}
                        onChange={e =>
                          onItemCheckChange(
                            'duplicateUrls',
                            item.url,
                            e.target.checked
                          )
                        }
                      />
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                      >
                        {item.url}
                      </a>
                      ({item.bookmarks.length}개)
                    </label>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {selectableCleanupItems.errorPages.length === 0 ? (
            <Section
              title="에러 페이지"
              count={selectableCleanupItems.errorPages.length}
              allChecked={errorPagesCheckboxState.allChecked}
              someChecked={errorPagesCheckboxState.someChecked}
              onSelectAllChange={checked =>
                handleSelectAll('errorPages', checked)
              }
              children={undefined}
            />
          ) : (
            <CollapsibleSection
              title="에러 페이지"
              count={selectableCleanupItems.errorPages.length}
              initialOpen={false}
              allChecked={errorPagesCheckboxState.allChecked}
              someChecked={errorPagesCheckboxState.someChecked}
              onSelectAllChange={checked =>
                handleSelectAll('errorPages', checked)
              }
            >
              {(() => {
                const groupedErrors = groupErrorPagesByCategory(
                  selectableCleanupItems.errorPages
                );
                const sortedCategories = ERROR_CATEGORY_ORDER.filter(
                  category => groupedErrors[category]
                );

                return sortedCategories.map(category => {
                  const categoryItems = groupedErrors[category];
                  const categoryCheckboxState = getCheckboxState(categoryItems);

                  return (
                    <div key={category} className="error-category">
                      <CollapsibleSection
                        title={`${category}`}
                        count={categoryItems.length}
                        initialOpen={false}
                        allChecked={categoryCheckboxState.allChecked}
                        someChecked={categoryCheckboxState.someChecked}
                        onSelectAllChange={checked => {
                          categoryItems.forEach(item => {
                            onItemCheckChange(
                              'errorPages',
                              item.bookmark.id,
                              checked
                            );
                          });
                        }}
                      >
                        <ul className="error-category-list">
                          {categoryItems.map(item => (
                            <li key={item.bookmark.id}>
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                }}
                              >
                                <Checkbox
                                  checked={item.isChecked}
                                  onChange={e =>
                                    onItemCheckChange(
                                      'errorPages',
                                      item.bookmark.id,
                                      e.target.checked
                                    )
                                  }
                                />
                                <div className="error-page-item">
                                  <a
                                    href={item.bookmark.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="error-page-url"
                                  >
                                    {item.bookmark.title || item.bookmark.url}
                                  </a>
                                  <div className="error-page-details">
                                    <span className="error-message">
                                      {item.errorMessage ||
                                        '🔗 링크에 접속할 수 없습니다'}
                                    </span>
                                    {item.errorCode && item.errorCode > 0 && (
                                      <span className="error-code">
                                        HTTP {item.errorCode}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </CollapsibleSection>
                    </div>
                  );
                });
              })()}
            </CollapsibleSection>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {ScanResultPanel()}
      <div className="main__actions">
        {isScanning ? (
          <Button variant="primary" size="medium" disabled>
            스캔 중...
          </Button>
        ) : selectableCleanupItems === null ? (
          <Button variant="primary" size="medium" onClick={onScan}>
            스캔
          </Button>
        ) : (
          <>
            <p className="main__selection-status">
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
