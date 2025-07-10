import { type ChangeEvent, useState } from 'react';
import { Button, Checkbox } from '@reasonjun/design-system-app';
import type { CleanupOptions } from '@/types/bookmark';
import './SettingsTab.css';

interface SettingsTabProps {
  options: CleanupOptions;
  onOptionsChange: (options: CleanupOptions) => void;
  onBackup: () => void;
  isProcessing: boolean;
}

export const SettingsTab = ({
  options,
  onOptionsChange,
  onBackup,
  isProcessing,
}: SettingsTabProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleOptionChange =
    (key: keyof CleanupOptions) => (e: ChangeEvent<HTMLInputElement>) => {
      onOptionsChange({
        ...options,
        [key]: e.target.checked,
      });
    };

  return (
    <div className="cleanup-control-panel">
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
      </div>

      <p className="cleanup-control-panel__info">
        💡 정리하기 전에 백업을 생성하는 것을 권장합니다.
      </p>
    </div>
  );
};

export default SettingsTab;
