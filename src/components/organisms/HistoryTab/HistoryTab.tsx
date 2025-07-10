import { useState, useEffect } from 'react';
import type { CleanupStats } from '@/types/bookmark';
import './HistoryTab.css';

export const HistoryTab = () => {
  const [lastCleanupStats, setLastCleanupStats] = useState<CleanupStats | null>(
    null
  );

  useEffect(() => {
    // localStorage에서 정리 결과 읽기
    const savedStats = localStorage.getItem('lastCleanupStats');
    if (savedStats) {
      try {
        setLastCleanupStats(JSON.parse(savedStats));
      } catch (error) {
        console.error('Failed to parse cleanup stats:', error);
        setLastCleanupStats(null);
      }
    }
  }, []);

  return (
    <>
      {lastCleanupStats ? (
        <div className="main__history">
          <h3>최근 정리 결과</h3>
          <ul className="main__history-list">
            <li>빈 폴더 {lastCleanupStats.emptyFoldersRemoved}개 제거</li>
            <li>중복 북마크 {lastCleanupStats.duplicatesRemoved}개 제거</li>
            <li>에러 페이지 {lastCleanupStats.errorPagesRemoved}개 제거</li>
          </ul>
          <p className="main__history-total">
            총 {lastCleanupStats.totalProcessed}개 항목 정리 완료
          </p>
        </div>
      ) : (
        <p className="main__empty-message">아직 정리 기록이 없습니다.</p>
      )}
    </>
  );
};
