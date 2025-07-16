import type {
  CleanupOptions,
  CleanupResult,
  ErrorPageBookmark,
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
  async scanBookmarks(
    options: CleanupOptions,
    onProgress?: (progress: number) => void
  ): Promise<CleanupResult> {
    const bookmarkTree = await this.getBookmarkTree();

    // 1단계: 빈 폴더 검사 (10%)
    onProgress?.(0);
    const result = analyzeBookmarkTree(bookmarkTree[0], options);
    onProgress?.(10);

    // 2단계: 중복 URL 검사 (10%)
    // analyzeBookmarkTree에서 이미 처리됨
    onProgress?.(20);

    // 3단계: 에러 페이지 검사 (80%)
    const errorPages = options.removeErrorPages
      ? await this.findErrorPages(
          extractAllBookmarks(bookmarkTree[0]),
          errorProgress => {
            // 에러 페이지 검사는 전체의 80%를 차지하므로
            // 20% + (에러 페이지 진행률 * 0.8)
            const totalProgress = 20 + errorProgress * 0.8;
            onProgress?.(Math.round(totalProgress));
          }
        )
      : [];

    onProgress?.(100);
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
    const TEN_SECONDS = 10000;
    const signal = AbortSignal.timeout(TEN_SECONDS);

    // 공통 응답 처리 함수
    const processResponse = (response: Response) => {
      if (response.status >= 400 && response.status < 600) {
        return { accessible: false, errorCode: response.status };
      }
      return { accessible: true };
    };

    // 각 시도를 위한 설정
    const attempts = [
      { method: 'HEAD', mode: 'cors' as RequestMode },
      { method: 'GET', mode: 'cors' as RequestMode },
      { method: 'GET', mode: 'no-cors' as RequestMode },
    ];

    for (const attempt of attempts) {
      try {
        const response = await fetch(url, {
          ...attempt,
          cache: 'no-cache',
          signal,
        });

        // no-cors 모드에서는 상태 코드를 확인할 수 없으므로 성공으로 간주
        if (attempt.mode === 'no-cors') {
          return { accessible: true };
        }

        return processResponse(response);
      } catch {
        // 마지막 시도가 아니면 다음 시도로 넘어감
        if (attempt !== attempts[attempts.length - 1]) {
          continue;
        }

        // 모든 시도가 실패했을 때
        return { accessible: false, errorCode: 0 };
      }
    }

    return { accessible: false, errorCode: 0 };
  }

  /**
   * 오프라인 상태를 확인하고 진행률을 완료 처리합니다.
   */
  private checkOfflineAndComplete(
    onProgress?: (progress: number) => void
  ): boolean {
    if (!navigator.onLine) {
      onProgress?.(100);
      return true;
    }
    return false;
  }

  /**
   * 에러 페이지들을 찾습니다.
   */
  async findErrorPages(
    bookmarks?: chrome.bookmarks.BookmarkTreeNode[],
    onProgress?: (progress: number) => void
  ): Promise<ErrorPageBookmark[]> {
    // 시작 전 온라인 상태 체크
    if (this.checkOfflineAndComplete(onProgress)) {
      return [];
    }

    // 북마크가 제공되지 않으면 전체 북마크에서 추출
    if (!bookmarks) {
      const bookmarkTree = await this.getBookmarkTree();
      bookmarks = extractAllBookmarks(bookmarkTree[0]);
    }

    const errorPages: ErrorPageBookmark[] = [];

    // 배치로 처리 (한 번에 너무 많은 HTTP 요청을 보내지 않도록)
    const batchSize = 10;
    const totalBookmarks = bookmarks.length;

    for (let i = 0; i < bookmarks.length; i += batchSize) {
      // 배치 시작 전 온라인 상태 체크
      if (this.checkOfflineAndComplete(onProgress)) {
        break;
      }

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

      // 진행률 보고
      if (onProgress) {
        const progress = Math.round(((i + batchSize) / totalBookmarks) * 100);
        onProgress(Math.min(progress, 100));
      }
    }

    return errorPages;
  }

  /**
   * 북마크를 제거합니다.
   */
  async removeBookmark(bookmarkId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.remove(bookmarkId, () => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        resolve();
      });
    });
  }

  /**
   * 북마크 폴더를 제거합니다.
   */
  async removeBookmarkFolder(folderId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.removeTree(folderId, () => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        resolve();
      });
    });
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
