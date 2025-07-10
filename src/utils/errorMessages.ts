/**
 * HTTP 상태 코드를 사용자 친화적인 메시지로 변환합니다.
 */
export function getErrorMessage(errorCode?: number): string {
  if (!errorCode || errorCode === 0) {
    return '🔗 링크에 접속할 수 없습니다';
  }

  // 4xx 클라이언트 에러
  if (errorCode >= 400 && errorCode < 500) {
    switch (errorCode) {
      case 400:
        return '❌ 잘못된 요청입니다';
      case 401:
        return '🔒 로그인이 필요합니다';
      case 403:
        return '🚫 접근 권한이 없습니다';
      case 404:
        return '📭 페이지를 찾을 수 없습니다';
      case 410:
        return '💀 페이지가 삭제되었습니다';
      case 429:
        return '⏰ 너무 많은 요청으로 차단되었습니다';
      default:
        return '🔧 페이지에 문제가 있습니다';
    }
  }

  // 5xx 서버 에러
  if (errorCode >= 500 && errorCode < 600) {
    switch (errorCode) {
      case 500:
        return '⚠️ 서버에 오류가 발생했습니다';
      case 502:
        return '🔄 서버 연결에 문제가 있습니다';
      case 503:
        return '🛠️ 서비스가 일시적으로 중단되었습니다';
      case 504:
        return '⏳ 서버 응답 시간이 초과되었습니다';
      default:
        return '🔥 서버에 문제가 발생했습니다';
    }
  }

  // 기타 상태 코드
  return `❓ 알 수 없는 오류 (${errorCode})`;
}

/**
 * 에러 코드의 카테고리를 반환합니다.
 */
export function getErrorCategory(errorCode?: number): string {
  if (!errorCode || errorCode === 0) {
    return '연결 오류';
  }

  if (errorCode >= 400 && errorCode < 500) {
    return '페이지 오류';
  }

  if (errorCode >= 500 && errorCode < 600) {
    return '서버 오류';
  }

  return '기타 오류';
}

/**
 * 에러 페이지들을 카테고리별로 그룹화합니다.
 */
export function groupErrorPagesByCategory<T extends { errorCode?: number }>(
  errorPages: T[]
): Record<string, T[]> {
  return errorPages.reduce(
    (groups, item) => {
      const category = getErrorCategory(item.errorCode);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}
