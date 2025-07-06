import type { CleanupResult, ErrorPageBookmark } from '../types/bookmark';

/**
 * 모든 북마크를 스캔하여 정리가 필요한 항목들을 찾습니다.
 */
export async function scanBookmarks(): Promise<CleanupResult> {
  const bookmarkTree = await chrome.bookmarks.getTree();
  const result: CleanupResult = {
    emptyFolders: [],
    duplicateUrls: [],
    errorPages: [],
  };

  const urlMap = new Map<string, chrome.bookmarks.BookmarkTreeNode[]>();

  // 재귀적으로 북마크 트리를 순회
  await traverseBookmarkTree(bookmarkTree[0], result, urlMap);

  // URL 맵을 중복 배열로 변환
  result.duplicateUrls = Array.from(urlMap.entries())
    .filter(([_, bookmarks]) => bookmarks.length > 1)
    .map(([url, bookmarks]) => ({ url, bookmarks }));

  return result;
}

/**
 * 북마크 트리를 재귀적으로 순회하며 분석합니다.
 */
async function traverseBookmarkTree(
  node: chrome.bookmarks.BookmarkTreeNode,
  result: CleanupResult,
  urlMap: Map<string, chrome.bookmarks.BookmarkTreeNode[]>
): Promise<void> {
  // 폴더인 경우
  if (node.children) {
    // 빈 폴더 체크 (루트 폴더는 제외)
    if (node.children.length === 0 && node.parentId) {
      result.emptyFolders.push(node);
    }

    // 자식 노드들 순회
    for (const child of node.children) {
      await traverseBookmarkTree(child, result, urlMap);
    }
  }
  // 북마크인 경우
  else if (node.url) {
    // 중복 URL 체크
    if (!urlMap.has(node.url)) {
      urlMap.set(node.url, []);
    }
    urlMap.get(node.url)!.push(node);
  }
}

/**
 * URL이 접근 가능한지 확인합니다.
 */
export async function checkUrlStatus(
  url: string
): Promise<{ accessible: boolean; errorCode?: number }> {
  try {
    // const response =
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors', // CORS 에러 방지
    });

    // no-cors 모드에서는 status를 확인할 수 없으므로
    // 실제로는 탭을 열어서 확인하는 방식을 사용해야 함
    return { accessible: true };
  } catch (error) {
    return { accessible: false, errorCode: 0 };
  }
}

/**
 * 탭을 열어서 실제 HTTP 상태를 확인합니다.
 */
export async function checkUrlStatusWithTab(
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
        if (updatedTabId !== tabId || changeInfo.status !== 'complete') return;

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
export async function findErrorPages(
  bookmarks: chrome.bookmarks.BookmarkTreeNode[]
): Promise<ErrorPageBookmark[]> {
  const errorPages: ErrorPageBookmark[] = [];

  // 배치로 처리 (한 번에 너무 많은 탭을 열지 않도록)
  const batchSize = 5;
  for (let i = 0; i < bookmarks.length; i += batchSize) {
    const batch = bookmarks.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async bookmark => {
        if (!bookmark.url) return null;

        const status = await checkUrlStatusWithTab(bookmark.url);
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
