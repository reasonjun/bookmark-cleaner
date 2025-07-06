import { findErrorPages, scanBookmarks } from '../utils/bookmarkScanner';
import {
  backupBookmarks,
  performCleanup,
  restoreBookmarks,
} from '../utils/bookmarkCleaner';
import type {
  CleanupOptions,
  CleanupResult,
  SelectableCleanupResult,
} from '../types/bookmark';

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

interface CheckErrorPagesMessage {
  action: 'checkErrorPages';
  bookmarks: chrome.bookmarks.BookmarkTreeNode[];
}

type Message =
  | ScanMessage
  | CleanupMessage
  | BackupMessage
  | RestoreMessage
  | CheckErrorPagesMessage;

// 현재 스캔 결과를 메모리에 저장
let currentScanResult: CleanupResult | null = null;

// 메시지 리스너
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    // 비동기 응답을 위해 true 반환
    handleMessage(message)
      .then(sendResponse)
      .catch(error => {
        sendResponse({ error: error.message });
      });

    return true; // 비동기 응답을 위해 필수
  }
);

async function handleMessage(message: Message) {
  switch (message.action) {
    case 'scan':
      // 북마크 스캔
      currentScanResult = await scanBookmarks();
      return {
        success: true,
        result: currentScanResult,
      };

    case 'cleanup':
      // 정리 작업 수행
      const stats = await performCleanup(message.items);

      // 정리 후 다시 스캔
      const updatedScanResult = await scanBookmarks();

      return {
        success: true,
        stats,
        updatedResult: updatedScanResult,
      };

    case 'backup':
      // 북마크 백업
      const backupData = await backupBookmarks();
      return {
        success: true,
        backupData,
      };

    case 'restore':
      // 북마크 복원
      await restoreBookmarks(message.backupData);
      return {
        success: true,
      };

    case 'checkErrorPages':
      // 에러 페이지 확인
      const errorPages = await findErrorPages(message.bookmarks);
      return {
        success: true,
        errorPages,
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

// 확장 프로그램 아이콘 클릭 시 팝업이 열리도록 설정
chrome.action.onClicked.addListener(() => {
  // manifest.json에서 default_popup을 설정했으므로 이 이벤트는 발생하지 않음
  // 필요시 프로그래밍 방식으로 팝업을 열 수 있음
});

export {};
