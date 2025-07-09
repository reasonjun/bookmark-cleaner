/**
 * 유틸리티 함수들을 위한 타입 정의
 */

/**
 * 타입 가드 함수들
 */
export function isEmptyFolder(
  item: unknown
): item is chrome.bookmarks.BookmarkTreeNode {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'title' in item &&
    'parentId' in item
  );
}

export function isDuplicateUrl(
  item: unknown
): item is { url: string; bookmarks: chrome.bookmarks.BookmarkTreeNode[] } {
  return (
    typeof item === 'object' &&
    item !== null &&
    'url' in item &&
    'bookmarks' in item &&
    Array.isArray((item as { bookmarks: unknown }).bookmarks)
  );
}

export function isErrorPage(item: unknown): item is {
  bookmark: chrome.bookmarks.BookmarkTreeNode;
  errorCode?: number;
  errorMessage?: string;
} {
  return (
    typeof item === 'object' &&
    item !== null &&
    'bookmark' in item &&
    typeof (item as { bookmark: unknown }).bookmark === 'object'
  );
}

/**
 * 제네릭 헬퍼 타입들
 */
export type WithIsChecked<T> = T & { isChecked: boolean };

export type CategoryUnion = 'emptyFolders' | 'duplicateUrls' | 'errorPages';

/**
 * 유틸리티 함수 타입들
 */
export type TransformFunction<T, U> = (item: T) => U;

export type FilterFunction<T> = (item: T) => boolean;

export type MapFunction<T, U> = (item: T, index?: number, array?: T[]) => U;
