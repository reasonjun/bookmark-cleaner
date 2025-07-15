import './HistoryTab.css';

import { useEffect, useState } from 'react';

import type { CleanupHistory } from '@/types/bookmark';

export const HistoryTab = () => {
  const [cleanupHistory, setCleanupHistory] = useState<CleanupHistory[]>([]);

  useEffect(() => {
    // localStorage에서 정리 이력 읽기
    const savedHistory = localStorage.getItem('cleanupHistory');
    if (savedHistory) {
      try {
        setCleanupHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to parse cleanup history:', error);
        setCleanupHistory([]);
      }
    }
  }, []);

  return (
    <>
      {cleanupHistory.length > 0 ? (
        <div className="main__history">
          <h2>정리 이력</h2>
          {cleanupHistory.map(history => (
            <div key={history.timestamp} className="main__history-item">
              <h3>{new Date(history.timestamp).toLocaleString()}</h3>
              <ul className="main__history-list">
                <li>빈 폴더 {history.stats.emptyFoldersRemoved}개 제거</li>
                <li>중복 북마크 {history.stats.duplicatesRemoved}개 제거</li>
                <li>에러 페이지 {history.stats.errorPagesRemoved}개 제거</li>
              </ul>
              <p className="main__history-total">
                총 {history.stats.totalProcessed}개 항목 정리 완료
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="main__empty-message">아직 정리 기록이 없습니다.</p>
      )}
    </>
  );
};
