import { LoadingOverlay, CollapsibleSection, Section } from '../../molecules';
import { ProgressBar } from '../../atoms';
import { Checkbox } from '@reasonjun/design-system-app';
import type { SelectableCleanupResult } from '../../../types/bookmark';
import type { SelectableItemUnion } from '../../../types/components';
import './ScanResultPanel.css';

// 아이콘 컴포넌트 (임시)
const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
);

export interface ScanResultPanelProps {
  /** 스캔 결과 */
  scanResult: SelectableCleanupResult | null;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 스캔 진행률 (0-100) */
  scanProgress?: number;
  /** 에러 메시지 */
  error?: string;
  /** 항목 체크박스 변경 핸들러 */
  onItemCheckChange: (
    category: keyof SelectableCleanupResult,
    id: string,
    isChecked: boolean
  ) => void;
}

export const ScanResultPanel = ({
  scanResult,
  isLoading = false,
  scanProgress,
  error,
  onItemCheckChange,
}: ScanResultPanelProps) => {
  if (error) {
    return (
      <div className="scan-result-panel scan-result-panel--error">
        <ErrorIcon />
        <p>{error}</p>
      </div>
    );
  }

  if (isLoading) {
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

  if (!scanResult) {
    return (
      <div className="scan-result-panel scan-result-panel--empty">
        <p>스캔 버튼을 클릭하여 북마크 정리를 시작하세요.</p>
      </div>
    );
  }

  const totalIssues =
    scanResult.emptyFolders.length +
    scanResult.duplicateUrls.length +
    scanResult.errorPages.length;

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
    if (!scanResult) return;
    // Call onItemCheckChange for each item in the category
    scanResult[category].forEach((item: SelectableItemUnion) => {
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

  const emptyFoldersCheckboxState = getCheckboxState(scanResult.emptyFolders);
  const duplicateUrlsCheckboxState = getCheckboxState(scanResult.duplicateUrls);
  const errorPagesCheckboxState = getCheckboxState(scanResult.errorPages);

  return (
    <div className="scan-result-panel">
      <div className="scan-result-panel__summary">
        <h2 className="scan-result-panel__title">스캔 결과</h2>
        <p className="scan-result-panel__subtitle">
          총 {totalIssues}개의 정리 가능한 항목을 발견했습니다.
        </p>
      </div>

      <div className="scan-result-panel__cards">
        {scanResult.emptyFolders.length === 0 ? (
          <Section
            title="빈 폴더"
            count={scanResult.emptyFolders.length}
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
            count={scanResult.emptyFolders.length}
            initialOpen={false}
            allChecked={emptyFoldersCheckboxState.allChecked}
            someChecked={emptyFoldersCheckboxState.someChecked}
            onSelectAllChange={checked =>
              handleSelectAll('emptyFolders', checked)
            }
          >
            <ul>
              {scanResult.emptyFolders.map(folder => (
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

        {scanResult.duplicateUrls.length === 0 ? (
          <Section
            title="중복 URL"
            count={scanResult.duplicateUrls.length}
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
            count={scanResult.duplicateUrls.length}
            initialOpen={false}
            allChecked={duplicateUrlsCheckboxState.allChecked}
            someChecked={duplicateUrlsCheckboxState.someChecked}
            onSelectAllChange={checked =>
              handleSelectAll('duplicateUrls', checked)
            }
          >
            <ul>
              {scanResult.duplicateUrls.map(item => (
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

        {scanResult.errorPages.length === 0 ? (
          <Section
            title="에러 페이지"
            count={scanResult.errorPages.length}
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
            count={scanResult.errorPages.length}
            initialOpen={false}
            allChecked={errorPagesCheckboxState.allChecked}
            someChecked={errorPagesCheckboxState.someChecked}
            onSelectAllChange={checked =>
              handleSelectAll('errorPages', checked)
            }
          >
            <ul>
              {scanResult.errorPages.map(item => (
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
                    <a
                      href={item.bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                    >
                      {item.bookmark.url}
                    </a>
                    ({item.errorMessage || '오류'})
                  </label>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
};
