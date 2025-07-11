import { bookmarkService } from '@/services/bookmarkService';
import {
  backupBookmarks,
  performCleanup,
  restoreBookmarks,
} from '@/utils/bookmarkCleaner';
import type { CleanupResult } from '@/types/bookmark';
import type { ChromeMessageType } from '@/types/chrome.ts';

// 현재 스캔 결과를 메모리에 저장
let currentScanResult: CleanupResult | null = null;

// 메시지 리스너
chrome.runtime.onMessage.addListener(
  (message: ChromeMessageType, _sender, sendResponse) => {
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

async function handleMessage(message: ChromeMessageType) {
  switch (message.action) {
    case 'scan':
      // 북마크 스캔
      currentScanResult = await bookmarkService.scanBookmarks(message.options);
      return {
        success: true,
        result: currentScanResult,
      };

    case 'cleanup': {
      // 정리 작업 수행
      const stats = await performCleanup(message.items);

      return {
        success: true,
        stats,
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

// 확장 프로그램 아이콘 클릭시 새 탭에서 앱 열기
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('index.html'),
  });
});

export {};
