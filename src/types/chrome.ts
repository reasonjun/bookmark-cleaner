/**
 * Chrome API 관련 타입 정의
 */

import type {
  CleanupResult,
  CleanupStats,
  SelectableCleanupResult,
} from './bookmark';

/**
 * Chrome 메시지 타입들
 */
export interface ChromeMessage {
  action: string;
  [key: string]: unknown;
}

export interface ScanMessage {
  action: 'scan';
}

export interface CleanupMessage {
  action: 'cleanup';
  items: Partial<SelectableCleanupResult>;
}

export interface BackupMessage {
  action: 'backup';
}

export interface RestoreMessage {
  action: 'restore';
  backupData: string;
}

export type ChromeMessageType =
  | ScanMessage
  | CleanupMessage
  | BackupMessage
  | RestoreMessage;

/**
 * Chrome 응답 타입들
 */
export interface ChromeResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ScanResponse extends ChromeResponse {
  result: CleanupResult;
}

export interface CleanupResponse extends ChromeResponse {
  stats: CleanupStats;
  updatedResult: CleanupResult;
}

export interface BackupResponse extends ChromeResponse {
  backupData: string;
}

/**
 * Chrome 탭 관련 타입들
 */
export interface TabCreateOptions {
  url: string;
  active?: boolean;
  pinned?: boolean;
  index?: number;
}

export interface TabUpdateInfo {
  status?: 'loading' | 'complete';
  url?: string;
  title?: string;
}

/**
 * Chrome 북마크 관련 확장 타입들
 */
export interface BookmarkCreateDetails {
  parentId?: string;
  index?: number;
  title?: string;
  url?: string;
}

export interface BookmarkUpdateDetails {
  title?: string;
  url?: string;
}

/**
 * Chrome 런타임 관련 타입들
 */
export interface RuntimeMessageSender {
  tab?: chrome.tabs.Tab;
  frameId?: number;
  id?: string;
  url?: string;
  tlsChannelId?: string;
}

export type MessageResponseCallback<T = unknown> = (response: T) => void;

export type MessageListener<T = unknown> = (
  message: ChromeMessage,
  sender: RuntimeMessageSender,
  sendResponse: MessageResponseCallback<T>
) => boolean | void;

/**
 * Chrome 이벤트 관련 타입들
 */
export interface InstallDetails {
  reason: 'install' | 'update' | 'chrome_update' | 'shared_module_update';
  previousVersion?: string;
  id?: string;
}

export type InstallListener = (details: InstallDetails) => void;

/**
 * Chrome API Mock 타입들
 */
export interface MockChromeAPI {
  bookmarks: {
    getTree: () => Promise<chrome.bookmarks.BookmarkTreeNode[]>;
    remove: (id: string) => Promise<void>;
    removeTree: (id: string) => Promise<void>;
    create: (
      details: BookmarkCreateDetails
    ) => Promise<chrome.bookmarks.BookmarkTreeNode>;
  };
  tabs: {
    create: (
      options: TabCreateOptions,
      callback?: (tab: chrome.tabs.Tab) => void
    ) => Promise<chrome.tabs.Tab>;
    remove: (tabId: number) => Promise<void>;
    get: (
      tabId: number,
      callback?: (tab: chrome.tabs.Tab) => void
    ) => Promise<chrome.tabs.Tab>;
    onUpdated: {
      addListener: (
        listener: (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => void
      ) => void;
      removeListener: (
        listener: (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => void
      ) => void;
    };
  };
  runtime: {
    id: string;
    sendMessage: (message: ChromeMessage) => Promise<ChromeResponse>;
    onMessage: {
      addListener: (listener: MessageListener) => void;
    };
    onInstalled: {
      addListener: (listener: InstallListener) => void;
    };
  };
  action: {
    onClicked: {
      addListener: (listener: (tab: chrome.tabs.Tab) => void) => void;
    };
  };
}
