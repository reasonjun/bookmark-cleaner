import type {
  CleanupResult,
  CleanupStats,
  SelectableCleanupResult,
} from '../types/bookmark';

export class ChromeMessageService {
  /**
   * 백그라운드 스크립트에 스캔 요청을 보냅니다.
   */
  async requestScan(): Promise<CleanupResult> {
    const response = await chrome.runtime.sendMessage({ action: 'scan' });
    if (response.success) {
      return response.result;
    }
    throw new Error('Scan failed');
  }

  /**
   * 백그라운드 스크립트에 정리 요청을 보냅니다.
   */
  async requestCleanup(items: Partial<SelectableCleanupResult>): Promise<{
    stats: CleanupStats;
    updatedResult: CleanupResult;
  }> {
    const response = await chrome.runtime.sendMessage({
      action: 'cleanup',
      items,
    });
    if (response.success) {
      return {
        stats: response.stats,
        updatedResult: response.updatedResult,
      };
    }
    throw new Error('Cleanup failed');
  }

  /**
   * 백그라운드 스크립트에 백업 요청을 보냅니다.
   */
  async requestBackup(): Promise<string> {
    const response = await chrome.runtime.sendMessage({ action: 'backup' });
    if (response.success) {
      return response.backupData;
    }
    throw new Error('Backup failed');
  }
}

// 싱글톤 인스턴스 생성
export const chromeMessageService = new ChromeMessageService();
