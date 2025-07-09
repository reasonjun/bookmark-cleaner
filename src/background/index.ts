import { bookmarkService } from '@/services/bookmarkService';
import {
  backupBookmarks,
  performCleanup,
  restoreBookmarks,
} from '@/utils/bookmarkCleaner';
import type { CleanupResult, SelectableCleanupResult } from '@/types/bookmark';

// 메시지 타입 정의
interface ScanMessage {
  action: 'scan';
}

interface CleanupMessage {
  action: 'cleanup';
  items: SelectableCleanupResult;
}

interface BackupMessage {
  action: 'backup';
}

interface RestoreMessage {
  action: 'restore';
  backupData: string;
}

type Message = ScanMessage | CleanupMessage | BackupMessage | RestoreMessage;

// 현재 스캔 결과를 메모리에 저장
let currentScanResult: CleanupResult | null = null;

// 메시지 리스너
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    // 비동기 응답을 위해 true 반환
    handleMessage(message)
      .then(sendResponse)
      .catch(error => {
        console.error('Background message handler error:', error);
        sendResponse({
          success: false,
          error: error.message || '알 수 없는 오류가 발생했습니다.',
        });
      });

    return true; // 비동기 응답을 위해 필수
  }
);

async function handleMessage(message: Message) {
  switch (message.action) {
    case 'scan':
      // 북마크 스캔
      currentScanResult = await bookmarkService.scanBookmarks();
      return {
        success: true,
        result: currentScanResult,
      };

    case 'cleanup': {
      // 정리 작업 수행
      const stats = await performCleanup(message.items);

      // 정리 후 다시 스캔
      const updatedScanResult = await bookmarkService.scanBookmarks();

      return {
        success: true,
        stats,
        updatedResult: updatedScanResult,
      };
    }

    case 'backup': {
      // 북마크 백업
      const backupData = await backupBookmarks();
      return {
        success: true,
        backupData,
      };
    }

    case 'restore':
      // 북마크 복원
      await restoreBookmarks(message.backupData);
      return {
        success: true,
      };

    default:
      throw new Error('알 수 없는 액션입니다.');
  }
}

// 확장 프로그램 설치/업데이트 시
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    console.log('BookmarkCleaner가 설치되었습니다.');
  } else if (details.reason === 'update') {
    console.log('BookmarkCleaner가 업데이트되었습니다.');
  }
});

export {};
