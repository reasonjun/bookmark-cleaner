import './SettingsTab.css';

import { Button, Checkbox } from '@reasonjun/design-system-app';
import { type ChangeEvent } from 'react';

import type { CleanupOptions } from '@/types/bookmark';

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
  const handleOptionChange =
    (key: keyof CleanupOptions) => (e: ChangeEvent<HTMLInputElement>) => {
      onOptionsChange({
        ...options,
        [key]: e.target.checked,
      });
    };

  return (
    <div className="cleanup-control-panel">
      <h2 className="cleanup-control-panel__title">정리 옵션</h2>

      <div className="cleanup-control-panel__options">
        <label
          className="cleanup-control-panel__option"
          htmlFor="removeEmptyFolders"
        >
          <Checkbox
            id="removeEmptyFolders"
            checked={options.removeEmptyFolders}
            onChange={handleOptionChange('removeEmptyFolders')}
            disabled={isProcessing}
          />
          <span className="cleanup-control-panel__option-label">
            빈 폴더 제거
          </span>
        </label>

        <label
          className="cleanup-control-panel__option"
          htmlFor="removeDuplicates"
        >
          <Checkbox
            id="removeDuplicates"
            checked={options.removeDuplicates}
            onChange={handleOptionChange('removeDuplicates')}
            disabled={isProcessing}
          />
          <span className="cleanup-control-panel__option-label">
            중복 북마크 제거
          </span>
        </label>

        <label
          className="cleanup-control-panel__option"
          htmlFor="removeErrorPages"
        >
          <Checkbox
            id="removeErrorPages"
            checked={options.removeErrorPages}
            onChange={handleOptionChange('removeErrorPages')}
            disabled={isProcessing}
          />
          <span className="cleanup-control-panel__option-label">
            에러 페이지 제거
          </span>
        </label>
      </div>

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
