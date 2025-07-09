import type { CleanupResult, DuplicateBookmark } from '../types/bookmark';

/**
 * 북마크 트리를 재귀적으로 순회하합니다.
 */
export function analyzeBookmarkTree(
  node: chrome.bookmarks.BookmarkTreeNode
): CleanupResult {
  const result: CleanupResult = {
    emptyFolders: [],
    duplicateUrls: [],
    errorPages: [],
  };

  const urlMap = new Map<string, chrome.bookmarks.BookmarkTreeNode[]>();

  // 재귀적으로 북마크 트리를 순회
  traverseBookmarkTree(node, result, urlMap);

  // URL 맵을 중복 배열로 변환
  result.duplicateUrls = Array.from(urlMap.entries())
    .filter(([, bookmarks]) => bookmarks.length > 1)
    .map(([url, bookmarks]) => ({ url, bookmarks }));

  return result;
}

/**
 * 북마크 트리를 재귀적으로 순회하며 분석합니다.
 */
function traverseBookmarkTree(
  node: chrome.bookmarks.BookmarkTreeNode,
  result: CleanupResult,
  urlMap: Map<string, chrome.bookmarks.BookmarkTreeNode[]>
): void {
  // 폴더인 경우
  if (node.children) {
    // 빈 폴더 체크 (루트 폴더는 제외)
    if (node.children.length === 0 && node.parentId) {
      result.emptyFolders.push(node);
    }

    // 자식 노드들 순회
    for (const child of node.children) {
      traverseBookmarkTree(child, result, urlMap);
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
 * 빈 폴더들을 찾습니다.
 */
export function findEmptyFolders(
  node: chrome.bookmarks.BookmarkTreeNode
): chrome.bookmarks.BookmarkTreeNode[] {
  const emptyFolders: chrome.bookmarks.BookmarkTreeNode[] = [];

  function traverse(currentNode: chrome.bookmarks.BookmarkTreeNode) {
    if (currentNode.children) {
      // 빈 폴더 체크 (루트 폴더는 제외)
      if (currentNode.children.length === 0 && currentNode.parentId) {
        emptyFolders.push(currentNode);
      }

      // 자식 노드들 순회
      for (const child of currentNode.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return emptyFolders;
}

/**
 * 중복 URL들을 찾습니다.
 */
export function findDuplicateUrls(
  node: chrome.bookmarks.BookmarkTreeNode
): DuplicateBookmark[] {
  const urlMap = new Map<string, chrome.bookmarks.BookmarkTreeNode[]>();

  function traverse(currentNode: chrome.bookmarks.BookmarkTreeNode) {
    if (currentNode.children) {
      // 자식 노드들 순회
      for (const child of currentNode.children) {
        traverse(child);
      }
    } else if (currentNode.url) {
      // 중복 URL 체크
      if (!urlMap.has(currentNode.url)) {
        urlMap.set(currentNode.url, []);
      }
      urlMap.get(currentNode.url)!.push(currentNode);
    }
  }

  traverse(node);

  // 중복된 URL들만 반환
  return Array.from(urlMap.entries())
    .filter(([, bookmarks]) => bookmarks.length > 1)
    .map(([url, bookmarks]) => ({ url, bookmarks }));
}

/**
 * 북마크 트리에서 모든 북마크들을 평면적으로 추출합니다.
 */
export function extractAllBookmarks(
  node: chrome.bookmarks.BookmarkTreeNode
): chrome.bookmarks.BookmarkTreeNode[] {
  const bookmarks: chrome.bookmarks.BookmarkTreeNode[] = [];

  function traverse(currentNode: chrome.bookmarks.BookmarkTreeNode) {
    if (currentNode.children) {
      // 자식 노드들 순회
      for (const child of currentNode.children) {
        traverse(child);
      }
    } else if (currentNode.url) {
      // 북마크인 경우 추가
      bookmarks.push(currentNode);
    }
  }

  traverse(node);
  return bookmarks;
}
