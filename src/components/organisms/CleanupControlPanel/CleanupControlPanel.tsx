import { type ChangeEvent, useState } from 'react';
import { Button, Checkbox } from '@reasonjun/design-system-app';
import type { CleanupOptions } from '../../../types/bookmark';
import './CleanupControlPanel.css';

export interface CleanupControlPanelProps {
  /** 정리 옵션 */
  options: CleanupOptions;
  /** 옵션 변경 핸들러 */
  onOptionsChange: (options: CleanupOptions) => void;
  /** 정리 시작 핸들러 */
  onCleanup: () => void;
  /** 백업 핸들러 */
  onBackup: () => void;
  /** 정리 진행 중 여부 */
  isProcessing?: boolean;
  /** 정리 가능 여부 (선택된 항목이 하나라도 있을 경우 true) */
  isCleanupPossible?: boolean;
  /** 초기 정리 단계 설정 */
  initialCleanupStep?: 'options' | 'review';
}

export const CleanupControlPanel = ({
  options,
  onOptionsChange,
  onCleanup,
  onBackup,
  isProcessing = false,
  isCleanupPossible = false,
  initialCleanupStep = 'options',
}: CleanupControlPanelProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cleanupStep, setCleanupStep] = useState<'options' | 'review'>(
    initialCleanupStep
  );

  const handleOptionChange =
    (key: keyof CleanupOptions) => (e: ChangeEvent<HTMLInputElement>) => {
      onOptionsChange({
        ...options,
        [key]: e.target.checked,
      });
    };

  return (
    <div className="cleanup-control-panel">
      {cleanupStep === 'options' && (
        <>
          <h3 className="cleanup-control-panel__title">정리 옵션</h3>

          <div className="cleanup-control-panel__options">
            <label className="cleanup-control-panel__option">
              <Checkbox
                checked={options.removeEmptyFolders}
                onChange={handleOptionChange('removeEmptyFolders')}
                disabled={isProcessing}
              />
              <span className="cleanup-control-panel__option-label">
                빈 폴더 제거
              </span>
            </label>

            <label className="cleanup-control-panel__option">
              <Checkbox
                checked={options.removeDuplicates}
                onChange={handleOptionChange('removeDuplicates')}
                disabled={isProcessing}
              />
              <span className="cleanup-control-panel__option-label">
                중복 북마크 제거
              </span>
            </label>

            <label className="cleanup-control-panel__option">
              <Checkbox
                checked={options.removeErrorPages}
                onChange={handleOptionChange('removeErrorPages')}
                disabled={isProcessing}
              />
              <span className="cleanup-control-panel__option-label">
                에러 페이지 제거
              </span>
            </label>
          </div>

          <button
            className="cleanup-control-panel__advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
            type="button"
          >
            {showAdvanced ? '고급 옵션 숨기기' : '고급 옵션 보기'}
          </button>

          {showAdvanced && (
            <div className="cleanup-control-panel__advanced">
              <label className="cleanup-control-panel__option">
                <Checkbox
                  checked={options.checkHttpStatus}
                  onChange={handleOptionChange('checkHttpStatus')}
                  disabled={isProcessing}
                />
                <span className="cleanup-control-panel__option-label">
                  HTTP 상태 확인 (느릴 수 있음)
                </span>
              </label>
            </div>
          )}

          <div className="cleanup-control-panel__actions">
            <Button
              variant="secondary"
              size="medium"
              onClick={onBackup}
              disabled={isProcessing}
            >
              백업 생성
            </Button>

            <Button
              variant="primary"
              size="medium"
              onClick={() => setCleanupStep('review')}
              disabled={isProcessing || !isCleanupPossible}
            >
              정리 미리보기
            </Button>
          </div>

          <p className="cleanup-control-panel__info">
            💡 정리하기 전에 백업을 생성하는 것을 권장합니다.
          </p>
        </>
      )}

      {cleanupStep === 'review' && (
        <>
          <h3 className="cleanup-control-panel__title">정리 미리보기</h3>
          <div className="cleanup-control-panel__review">
            <p>선택된 정리 옵션:</p>
            <ul>
              {options.removeEmptyFolders && <li>빈 폴더 제거</li>}
              {options.removeDuplicates && <li>중복 북마크 제거</li>}
              {options.removeErrorPages && <li>에러 페이지 제거</li>}
              {options.checkHttpStatus && <li>HTTP 상태 확인</li>}
            </ul>
            <p className="cleanup-control-panel__info">
              선택된 옵션에 따라 북마크가 정리됩니다. 이 작업은 되돌릴 수
              없습니다.
            </p>
          </div>
          <div className="cleanup-control-panel__actions">
            <Button
              variant="secondary"
              size="medium"
              onClick={() => setCleanupStep('options')}
              disabled={isProcessing}
            >
              뒤로
            </Button>
            <Button
              variant="primary"
              size="medium"
              onClick={onCleanup}
              disabled={isProcessing}
            >
              {isProcessing ? '정리 중...' : '정리 실행'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
