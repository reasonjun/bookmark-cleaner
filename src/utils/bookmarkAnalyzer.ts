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
  return {
    emptyFolders: options.removeEmptyFolders ? findEmptyFolders(node) : [],
    duplicateUrls: options.removeDuplicates ? findDuplicateUrls(node) : [],
    errorPages: [],
  };
}

/**
 * 빈 폴더들을 찾습니다.
 */
export function findEmptyFolders(
  node: chrome.bookmarks.BookmarkTreeNode,
  emptyFolders: chrome.bookmarks.BookmarkTreeNode[] = []
): chrome.bookmarks.BookmarkTreeNode[] {
  if (node.children) {
    // 빈 폴더 체크 (북마크 바, 기타북마크는 제외)
    if (isEmptyFolder(node) && !isSpecialFolder(node)) {
      emptyFolders.push(node);
    }

    // 자식 노드들 순회
    for (const child of node.children) {
      findEmptyFolders(child, emptyFolders);
    }
  }

  return emptyFolders;
}

/**
 * 폴더가 비어있는지 확인합니다.
 */
function isEmptyFolder(node: chrome.bookmarks.BookmarkTreeNode): boolean {
  if (!node.children) return false;

  // 아무것도 없는 경우만 빈 폴더로 간주
  return node.children.length === 0;
}

/**
 * 특수 폴더(북마크 바, 기타북마크 등)인지 확인합니다.
 */
function isSpecialFolder(node: chrome.bookmarks.BookmarkTreeNode): boolean {
  // folderType 속성이 있으면 특수 폴더
  return !!node.folderType;
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
