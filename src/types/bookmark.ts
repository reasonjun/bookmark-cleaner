// 북마크 정리 결과 타입
export interface CleanupResult {
  emptyFolders: chrome.bookmarks.BookmarkTreeNode[];
  duplicateUrls: DuplicateBookmark[];
  errorPages: ErrorPageBookmark[];
}

// 중복 북마크 정보
export interface DuplicateBookmark {
  url: string;
  bookmarks: chrome.bookmarks.BookmarkTreeNode[];
}

// 에러 페이지 북마크 정보
export interface ErrorPageBookmark {
  bookmark: chrome.bookmarks.BookmarkTreeNode;
  errorCode?: number;
  errorMessage?: string;
}

// 정리 작업 통계
export interface CleanupStats {
  emptyFoldersRemoved: number;
  duplicatesRemoved: number;
  errorPagesRemoved: number;
  totalProcessed: number;
}

// 정리 옵션
export interface CleanupOptions {
  removeEmptyFolders: boolean;
  removeDuplicates: boolean;
  removeErrorPages: boolean;
  checkHttpStatus: boolean;
}

// 선택 가능한 빈 폴더
export interface SelectableEmptyFolder
  extends chrome.bookmarks.BookmarkTreeNode {
  isChecked: boolean;
}

// 선택 가능한 중복 북마크
export interface SelectableDuplicateUrl extends DuplicateBookmark {
  isChecked: boolean;
}

// 선택 가능한 에러 페이지 북마크
export interface SelectableErrorPage extends ErrorPageBookmark {
  isChecked: boolean;
}

// 선택 가능한 정리 항목들의 결과 타입
export interface SelectableCleanupResult {
  emptyFolders: SelectableEmptyFolder[];
  duplicateUrls: SelectableDuplicateUrl[];
  errorPages: SelectableErrorPage[];
}
