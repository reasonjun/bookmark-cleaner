/**
 * 백업 데이터를 JSON 파일로 다운로드합니다.
 */
export function downloadBackupFile(backupData: string): void {
  const blob = new Blob([backupData], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bookmark-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 파일 다운로드를 위한 일반적인 유틸리티 함수입니다.
 */
export function downloadFile(
  content: string,
  fileName: string,
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
