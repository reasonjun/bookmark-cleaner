import type { CleanupStats, SelectableCleanupResult } from '@/types/bookmark';

/**
 * 빈 폴더들을 삭제합니다.
 */
export async function removeEmptyFolders(
  folders: chrome.bookmarks.BookmarkTreeNode[]
): Promise<number> {
  let removedCount = 0;

  // 하위 폴더부터 삭제하도록 정렬 (깊이가 깊은 것부터)
  const sortedFolders = [...folders].sort((a, b) => {
    const depthA = a.id.split('/').length;
    const depthB = b.id.split('/').length;
    return depthB - depthA;
  });

  for (const folder of sortedFolders) {
    try {
      await chrome.bookmarks.remove(folder.id);
      removedCount++;
    } catch (error) {
      console.error(`Failed to remove empty folder ${folder.title}:`, error);
    }
  }

  return removedCount;
}

/**
 * 중복된 북마크들을 제거합니다.
 * 가장 오래된 북마크만 남기고 나머지는 삭제합니다.
 */
export async function removeDuplicateBookmarks(
  duplicates: { url: string; bookmarks: chrome.bookmarks.BookmarkTreeNode[] }[]
): Promise<number> {
  let removedCount = 0;

  for (const { bookmarks } of duplicates) {
    // dateAdded가 가장 작은 (오래된) 북마크 찾기
    const sortedBookmarks = [...bookmarks].sort((a, b) => {
      const dateA = a.dateAdded || 0;
      const dateB = b.dateAdded || 0;
      return dateA - dateB;
    });

    // 첫 번째(가장 오래된) 북마크를 제외한 나머지 삭제
    for (let i = 1; i < sortedBookmarks.length; i++) {
      try {
        await chrome.bookmarks.remove(sortedBookmarks[i].id);
        removedCount++;
      } catch (error) {
        console.error(`Failed to remove duplicate bookmark:`, error);
      }
    }
  }

  return removedCount;
}

/**
 * 에러 페이지 북마크들을 제거합니다.
 */
export async function removeErrorPageBookmarks(
  errorPages: { bookmark: chrome.bookmarks.BookmarkTreeNode }[]
): Promise<number> {
  let removedCount = 0;

  for (const { bookmark } of errorPages) {
    try {
      await chrome.bookmarks.remove(bookmark.id);
      removedCount++;
    } catch (error) {
      console.error(`Failed to remove error page bookmark:`, error);
    }
  }

  return removedCount;
}

/**
 * 전체 정리 작업을 수행합니다.
 */
export async function performCleanup(
  itemsToCleanup: SelectableCleanupResult
): Promise<CleanupStats> {
  const stats: CleanupStats = {
    emptyFoldersRemoved: 0,
    duplicatesRemoved: 0,
    errorPagesRemoved: 0,
    totalProcessed: 0,
  };

  // 빈 폴더 제거
  const checkedEmptyFolders = itemsToCleanup.emptyFolders.filter(
    f => f.isChecked
  );
  if (checkedEmptyFolders.length > 0) {
    stats.emptyFoldersRemoved = await removeEmptyFolders(checkedEmptyFolders);
  }

  // 중복 북마크 제거
  const checkedDuplicateUrls = itemsToCleanup.duplicateUrls.filter(
    d => d.isChecked
  );
  if (checkedDuplicateUrls.length > 0) {
    stats.duplicatesRemoved =
      await removeDuplicateBookmarks(checkedDuplicateUrls);
  }

  // 에러 페이지 제거
  const checkedErrorPages = itemsToCleanup.errorPages.filter(e => e.isChecked);
  if (checkedErrorPages.length > 0) {
    stats.errorPagesRemoved = await removeErrorPageBookmarks(checkedErrorPages);
  }

  stats.totalProcessed =
    stats.emptyFoldersRemoved +
    stats.duplicatesRemoved +
    stats.errorPagesRemoved;

  return stats;
}

/**
 * 북마크를 백업합니다.
 */
export async function backupBookmarks(): Promise<string> {
  const bookmarkTree = await chrome.bookmarks.getTree();
  const backup = {
    version: 1,
    timestamp: new Date().toISOString(),
    bookmarks: bookmarkTree,
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * 백업에서 북마크를 복원합니다.
 */
export async function restoreBookmarks(backupJson: string): Promise<void> {
  try {
    const backup = JSON.parse(backupJson);
    if (!backup.bookmarks || !Array.isArray(backup.bookmarks)) {
      throw new Error('Invalid backup format');
    }

    // 현재 북마크 모두 삭제 (루트 폴더 제외)
    const currentTree = await chrome.bookmarks.getTree();
    await clearBookmarks(currentTree[0]);

    // 백업에서 복원
    await restoreBookmarkTree(backup.bookmarks[0], '0');
  } catch (error) {
    console.error('Failed to restore bookmarks:', error);
    throw error;
  }
}

/**
 * 모든 북마크를 삭제합니다 (루트 폴더 제외).
 */
async function clearBookmarks(
  node: chrome.bookmarks.BookmarkTreeNode
): Promise<void> {
  if (node.children) {
    for (const child of node.children) {
      if (!child.unmodifiable) {
        await chrome.bookmarks.removeTree(child.id);
      }
    }
  }
}

/**
 * 북마크 트리를 복원합니다.
 */
async function restoreBookmarkTree(
  node: chrome.bookmarks.BookmarkTreeNode,
  parentId: string
): Promise<void> {
  // 루트 노드는 건너뛰고 자식들만 처리
  if (node.id === '0') {
    if (node.children) {
      for (const child of node.children) {
        await restoreBookmarkTree(child, child.parentId || '0');
      }
    }
    return;
  }

  // 수정 불가능한 폴더는 그대로 사용
  if (node.unmodifiable && node.children) {
    for (const child of node.children) {
      await restoreBookmarkTree(child, node.id);
    }
    return;
  }

  // 새 북마크/폴더 생성
  const createDetails: chrome.bookmarks.BookmarkCreateArg = {
    parentId,
    title: node.title,
  };

  if (node.url) {
    createDetails.url = node.url;
  }

  const created = await chrome.bookmarks.create(createDetails);

  // 자식 노드들 복원
  if (node.children) {
    for (const child of node.children) {
      await restoreBookmarkTree(child, created.id);
    }
  }
}
