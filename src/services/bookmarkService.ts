import type {
  CleanupResult,
  ErrorPageBookmark,
  CleanupOptions,
} from '@/types/bookmark';
import {
  analyzeBookmarkTree,
  extractAllBookmarks,
} from '@/utils/bookmarkAnalyzer';
import { getErrorMessage } from '@/utils/errorMessages';

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
  async scanBookmarks(options: CleanupOptions): Promise<CleanupResult> {
    const bookmarkTree = await this.getBookmarkTree();
    const result = analyzeBookmarkTree(bookmarkTree[0], options);

    // 에러 페이지 제거 옵션이 활성화된 경우에만 에러 페이지 검사 실행
    const errorPages = options.removeErrorPages
      ? await this.findErrorPages(extractAllBookmarks(bookmarkTree[0]))
      : [];

    return {
      ...result,
      errorPages,
    };
  }

  /**
   * URL이 접근 가능한지 확인합니다.
   */
  async checkUrlStatus(
    url: string
  ): Promise<{ accessible: boolean; errorCode?: number }> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'cors', // CORS 모드로 변경하여 status code 확인 가능
      });

      // 400번대와 500번대 상태 코드는 에러 페이지로 분류
      if (response.status >= 400 && response.status < 600) {
        return { accessible: false, errorCode: response.status };
      }

      return { accessible: true };
    } catch {
      // 네트워크 에러나 CORS 에러가 발생하면 다시 no-cors 모드로 시도
      try {
        await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors',
        });
        // no-cors 모드에서 성공하면 접근 가능한 것으로 판단
        return { accessible: true };
      } catch {
        return { accessible: false, errorCode: 0 };
      }
    }
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

    // 배치로 처리 (한 번에 너무 많은 HTTP 요청을 보내지 않도록)
    const batchSize = 5;

    for (let i = 0; i < bookmarks.length; i += batchSize) {
      const batch = bookmarks.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async bookmark => {
          if (!bookmark.url) {
            return null;
          }

          const status = await this.checkUrlStatus(bookmark.url);
          if (!status.accessible) {
            return {
              bookmark,
              errorCode: status.errorCode,
              errorMessage: getErrorMessage(status.errorCode),
            };
          }
          return null;
        })
      );

      results.forEach(r => {
        if (r !== null) {
          errorPages.push(r);
        }
      });
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
