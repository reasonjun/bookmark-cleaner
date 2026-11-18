import type {
  CleanupOptions,
  CleanupResult,
  CleanupStats,
  SelectableCleanupResult,
} from '@/types/bookmark';
import type { ScanProgressMessage } from '@/types/chrome';

const NOT_EXTENSION_ERROR =
  '이 기능은 Chrome 확장 프로그램 안에서만 동작합니다.';

/**
 * 확장 프로그램 환경인지 확인합니다.
 * 일반 웹 페이지에도 chrome.runtime(sendMessage만 있는 형태)이 노출될 수 있지만,
 * runtime.id는 확장 프로그램 안에서만 존재합니다.
 */
export function isExtensionContext(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
}

function getRuntime(): typeof chrome.runtime {
  if (!isExtensionContext()) {
    throw new Error(NOT_EXTENSION_ERROR);
  }
  return chrome.runtime;
}

export class ChromeMessageService {
  /**
   * 백그라운드 스크립트에 메시지를 보내고, 성공 응답을 그대로 돌려줍니다.
   */
  private send<T>(message: object, fallbackError: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const runtime = getRuntime();
      runtime.sendMessage(message, response => {
        if (runtime.lastError) {
          return reject(new Error(runtime.lastError.message));
        }
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || fallbackError));
        }
      });
    });
  }

  /**
   * 백그라운드 스크립트의 스캔 진행률을 구독합니다.
   * 확장 프로그램 환경이 아니면 아무것도 하지 않습니다.
   * @returns 구독 해제 함수
   */
  onScanProgress(callback: (progress: number) => void): () => void {
    if (!isExtensionContext()) {
      return () => {};
    }

    const listener = (message: ScanProgressMessage) => {
      if (message.action === 'scan_progress') {
        callback(message.progress);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }

  /**
   * 백그라운드 스크립트에 스캔 요청을 보냅니다.
   */
  async requestScan(options: CleanupOptions): Promise<CleanupResult> {
    const { result } = await this.send<{ result: CleanupResult }>(
      { action: 'scan', options },
      'Scan failed'
    );
    return result;
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
    const { stats, updatedResult } = await this.send<{
      stats: CleanupStats;
      updatedResult: CleanupResult;
    }>({ action: 'cleanup', items, options }, 'Cleanup failed');
    return { stats, updatedResult };
  }

  /**
   * 백그라운드 스크립트에 백업 요청을 보냅니다.
   */
  async requestBackup(): Promise<string> {
    const { backupData } = await this.send<{ backupData: string }>(
      { action: 'backup' },
      'Backup failed'
    );
    return backupData;
  }
}

// 싱글톤 인스턴스 생성
export const chromeMessageService = new ChromeMessageService();
