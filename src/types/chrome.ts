import type { CleanupOptions, SelectableCleanupResult } from './bookmark';

/**
 * 백그라운드 스크립트 메시지 타입들
 */

export interface ScanMessage {
  action: 'scan';
  options: CleanupOptions;
}

export interface CleanupMessage {
  action: 'cleanup';
  items: SelectableCleanupResult;
  options: CleanupOptions;
}

export interface BackupMessage {
  action: 'backup';
}

export interface RestoreMessage {
  action: 'restore';
  backupData: string;
}

export interface ScanProgressMessage {
  action: 'scan_progress';
  progress: number;
}

export type ChromeMessageType =
  | ScanMessage
  | CleanupMessage
  | BackupMessage
  | RestoreMessage
  | ScanProgressMessage;
