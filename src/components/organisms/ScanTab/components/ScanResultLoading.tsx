import { LoadingOverlay } from '@/components';
import { ProgressBar } from '@/components/atoms';

interface ScanResultLoadingProps {
  scanProgress?: number;
}

export const ScanResultLoading = ({ scanProgress }: ScanResultLoadingProps) => (
  <div className="scan-result-panel">
    <LoadingOverlay
      visible={true}
      message="북마크를 스캔하는 중..."
      blur={false}
    />
    {scanProgress !== undefined && (
      <div className="scan-result-panel__progress">
        <ProgressBar value={scanProgress} variant="primary" animated striped />
        <span className="scan-result-panel__progress-text">
          {scanProgress}% 완료
        </span>
      </div>
    )}
  </div>
);
