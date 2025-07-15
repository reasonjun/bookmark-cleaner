import { ErrorIcon } from '@/components/atoms';

interface ScanResultErrorProps {
  error: string;
}

export const ScanResultError = ({ error }: ScanResultErrorProps) => (
  <div className="scan-result-panel scan-result-panel--error" role="alert">
    <ErrorIcon />
    <p>{error}</p>
  </div>
);
