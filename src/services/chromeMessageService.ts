import type {
  CleanupOptions,
  CleanupResult,
  CleanupStats,
  SelectableCleanupResult,
} from '@/types/bookmark';

export class ChromeMessageService {
  /**
   * 백그라운드 스크립트에 스캔 요청을 보냅니다.
   */
  async requestScan(options: CleanupOptions): Promise<CleanupResult> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'scan', options }, response => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        if (response && response.success) {
          resolve(response.result);
        } else {
          reject(new Error(response?.error || 'Scan failed'));
        }
      });
    });
  }

  /**
   * 백그라운드 스크립트에 정리 요청을 보냅니다.
   */
  async requestCleanup(
    items: Partial<SelectableCleanupResult>,
    options: CleanupOptions
  ): Promise<{
    stats: CleanupStats;
    updatedResult: CleanupResult;
  }> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'cleanup', items, options },
        response => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          if (response && response.success) {
            resolve({
              stats: response.stats,
              updatedResult: response.updatedResult,
            });
          } else {
            reject(new Error(response?.error || 'Cleanup failed'));
          }
        }
      );
    });
  }

  /**
   * 백그라운드 스크립트에 백업 요청을 보냅니다.
   */
  async requestBackup(): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'backup' }, response => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        if (response && response.success) {
          resolve(response.backupData);
        } else {
          reject(new Error(response?.error || 'Backup failed'));
        }
      });
    });
  }
}

// 싱글톤 인스턴스 생성
export const chromeMessageService = new ChromeMessageService();
