import type { CleanupResult, ErrorPageBookmark } from '@/types/bookmark';
import {
  analyzeBookmarkTree,
  extractAllBookmarks,
} from '@/utils/bookmarkAnalyzer';

export class BookmarkService {
  /**
   * 북마크 트리를 가져옵니다.
   */
  async getBookmarkTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    return chrome.bookmarks.getTree();
  }

  /**
   * 모든 북마크를 스캔하여 정리가 필요한 항목들을 찾습니다.
   */
  async scanBookmarks(): Promise<CleanupResult> {
    const bookmarkTree = await this.getBookmarkTree();
    return analyzeBookmarkTree(bookmarkTree[0]);
  }

  /**
   * URL이 접근 가능한지 확인합니다.
   */
  async checkUrlStatus(
    url: string
  ): Promise<{ accessible: boolean; errorCode?: number }> {
    try {
      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors', // CORS 에러 방지
      });

      // no-cors 모드에서는 status를 확인할 수 없으므로
      // 실제로는 탭을 열어서 확인하는 방식을 사용해야 함
      return { accessible: true };
    } catch {
      return { accessible: false, errorCode: 0 };
    }
  }

  /**
   * 탭을 열어서 실제 HTTP 상태를 확인합니다.
   */
  async checkUrlStatusWithTab(
    url: string
  ): Promise<{ accessible: boolean; errorCode?: number }> {
    return new Promise(resolve => {
      // 탭을 백그라운드에서 열기
      chrome.tabs.create({ url, active: false }, tab => {
        if (!tab.id) {
          resolve({ accessible: false, errorCode: 0 });
          return;
        }

        const tabId = tab.id;

        // 타임아웃 설정 (5초)
        const timeout = setTimeout(() => {
          chrome.tabs.remove(tabId);
          resolve({ accessible: false, errorCode: 0 });
        }, 5000);

        // 탭 업데이트 이벤트 리스너
        const updateListener = (
          updatedTabId: number,
          changeInfo: chrome.tabs.TabChangeInfo
        ) => {
          if (updatedTabId !== tabId || changeInfo.status !== 'complete')
            return;

          clearTimeout(timeout);
          chrome.tabs.onUpdated.removeListener(updateListener);

          // 탭 정보 가져오기
          chrome.tabs.get(tabId, updatedTab => {
            chrome.tabs.remove(tabId);

            // 에러 페이지 체크
            if (updatedTab.url?.startsWith('chrome-error://')) {
              resolve({ accessible: false, errorCode: 404 });
            } else {
              resolve({ accessible: true });
            }
          });
        };

        chrome.tabs.onUpdated.addListener(updateListener);
      });
    });
  }

  /**
   * 에러 페이지들을 찾습니다.
   */
  async findErrorPages(
    bookmarks?: chrome.bookmarks.BookmarkTreeNode[]
  ): Promise<ErrorPageBookmark[]> {
    // 북마크가 제공되지 않으면 전체 북마크에서 추출
    if (!bookmarks) {
      const bookmarkTree = await this.getBookmarkTree();
      bookmarks = extractAllBookmarks(bookmarkTree[0]);
    }

    const errorPages: ErrorPageBookmark[] = [];

    // 배치로 처리 (한 번에 너무 많은 탭을 열지 않도록)
    const batchSize = 5;
    for (let i = 0; i < bookmarks.length; i += batchSize) {
      const batch = bookmarks.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async bookmark => {
          if (!bookmark.url) return null;

          const status = await this.checkUrlStatusWithTab(bookmark.url);
          if (!status.accessible) {
            return {
              bookmark,
              errorCode: status.errorCode,
              errorMessage: `HTTP ${status.errorCode || 'Error'}`,
            };
          }
          return null;
        })
      );

      errorPages.push(
        ...results.filter((r): r is ErrorPageBookmark => r !== null)
      );
    }

    return errorPages;
  }

  /**
   * 북마크를 제거합니다.
   */
  async removeBookmark(bookmarkId: string): Promise<void> {
    await chrome.bookmarks.remove(bookmarkId);
  }

  /**
   * 북마크 폴더를 제거합니다.
   */
  async removeBookmarkFolder(folderId: string): Promise<void> {
    await chrome.bookmarks.removeTree(folderId);
  }

  /**
   * 북마크 백업을 생성합니다.
   */
  async createBackup(): Promise<string> {
    const bookmarkTree = await this.getBookmarkTree();
    return JSON.stringify(bookmarkTree, null, 2);
  }
}

// 싱글톤 인스턴스 생성
export const bookmarkService = new BookmarkService();
