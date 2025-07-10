import type {
  CleanupResult,
  DuplicateBookmark,
  CleanupOptions,
} from '@/types/bookmark';

/**
 * 북마크 트리를 재귀적으로 순회 합니다.
 */
export function analyzeBookmarkTree(
  node: chrome.bookmarks.BookmarkTreeNode,
  options: CleanupOptions
): CleanupResult {
  const result: CleanupResult = {
    emptyFolders: [],
    duplicateUrls: [],
    errorPages: [],
  };

  const urlMap = new Map<string, chrome.bookmarks.BookmarkTreeNode[]>();

  // 재귀적으로 북마크 트리를 순회
  traverseBookmarkTree(node, result, urlMap, options);

  // 중복 URL 옵션이 활성화된 경우에만 중복 배열로 변환
  if (options.removeDuplicates) {
    result.duplicateUrls = Array.from(urlMap.entries())
      .filter(([, bookmarks]) => bookmarks.length > 1)
      .map(([url, bookmarks]) => ({ url, bookmarks }));
  }

  return result;
}

/**
 * 북마크 트리를 재귀적으로 순회하며 분석합니다.
 */
function traverseBookmarkTree(
  node: chrome.bookmarks.BookmarkTreeNode,
  result: CleanupResult,
  urlMap: Map<string, chrome.bookmarks.BookmarkTreeNode[]>,
  options: CleanupOptions
): void {
  // 폴더인 경우
  if (node.children) {
    // 빈 폴더 제거 옵션이 활성화된 경우에만 빈 폴더 체크 (루트 폴더는 제외)
    if (
      options.removeEmptyFolders &&
      node.parentId &&
      isEmptyFolder(node, options)
    ) {
      result.emptyFolders.push(node);
    }

    // 자식 노드들 순회
    for (const child of node.children) {
      traverseBookmarkTree(child, result, urlMap, options);
    }
  }
  // 북마크인 경우
  else if (node.url) {
    // 중복 URL 체크 옵션이 활성화된 경우에만 중복 URL 체크
    if (options.removeDuplicates) {
      if (!urlMap.has(node.url)) {
        urlMap.set(node.url, []);
      }
      urlMap.get(node.url)!.push(node);
    }
  }
}

/**
 * 빈 폴더들을 찾습니다.
 */
export function findEmptyFolders(
  node: chrome.bookmarks.BookmarkTreeNode,
  options: CleanupOptions
): chrome.bookmarks.BookmarkTreeNode[] {
  const emptyFolders: chrome.bookmarks.BookmarkTreeNode[] = [];

  function traverse(currentNode: chrome.bookmarks.BookmarkTreeNode) {
    if (currentNode.children) {
      // 빈 폴더 체크 (루트 폴더는 제외)
      if (currentNode.parentId && isEmptyFolder(currentNode, options)) {
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
 * 폴더가 비어있는지 확인합니다.
 */
function isEmptyFolder(
  node: chrome.bookmarks.BookmarkTreeNode,
  options: CleanupOptions
): boolean {
  if (!node.children) return false;

  if (options.emptyFolderIncludesSubfolders) {
    // 하위 폴더만 있는 경우도 빈 폴더로 간주
    return !hasBookmarks(node);
  } else {
    // 아무것도 없는 경우만 빈 폴더로 간주
    return node.children.length === 0;
  }
}

/**
 * 노드 하위에 실제 북마크(URL)가 있는지 확인합니다.
 */
function hasBookmarks(node: chrome.bookmarks.BookmarkTreeNode): boolean {
  if (!node.children) return false;

  for (const child of node.children) {
    if (child.url) {
      return true; // URL이 있는 북마크 발견
    }
    if (child.children && hasBookmarks(child)) {
      return true; // 하위 폴더에 북마크 발견
    }
  }

  return false;
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
