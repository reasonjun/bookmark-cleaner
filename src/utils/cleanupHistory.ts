import type { CleanupHistory, CleanupStats } from '@/types/bookmark';

/**
 * 정리 이력 관리 유틸리티 함수들
 */

const CLEANUP_HISTORY_KEY = 'cleanupHistory';

/**
 * localStorage에서 정리 이력을 조회합니다.
 */
export function getCleanupHistory(): CleanupHistory[] {
  try {
    const history = localStorage.getItem(CLEANUP_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to retrieve cleanup history:', error);
    return [];
  }
}

/**
 * 새로운 정리 이력을 localStorage에 저장합니다.
 */
export function saveCleanupHistory(stats: CleanupStats): void {
  try {
    const newCleanupHistory: CleanupHistory = {
      timestamp: Date.now(),
      stats,
    };

    const existingHistory = getCleanupHistory();
    const updatedHistory = [newCleanupHistory, ...existingHistory];

    localStorage.setItem(CLEANUP_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to save cleanup history:', error);
    throw error;
  }
}
