# Bookmark Cleaner

북마크를 자동으로 정리하고 분류하는 Chrome 확장 프로그램입니다.

## 기능

- 북마크 스캔 및 분석
- 중복 북마크 감지
- 접근 불가능한 북마크 정리
- 북마크 자동 분류
- 실시간 정리 진행 상황 표시

## 기술 스택

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **UI Components**: Atomic Design Pattern
- **Linting**: ESLint + Prettier
- **Package Manager**: pnpm

## 프로젝트 구조

```
src/
├── components/          # 컴포넌트 (Atomic Design)
│   ├── atoms/          # 기본 UI 컴포넌트
│   ├── molecules/      # 복합 컴포넌트
│   └── organisms/      # 복잡한 UI 블록
├── popup/              # 확장 프로그램 팝업
├── background/         # 백그라운드 스크립트
├── utils/              # 유틸리티 함수
└── types/              # TypeScript 타입 정의
```

## 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 린트 확인
pnpm lint

# 코드 포맷팅
pnpm format
```

## 확장 프로그램 설치

1. `pnpm build` 명령으로 빌드
2. Chrome 확장 프로그램 페이지 (chrome://extensions/) 접속
3. 개발자 모드 활성화
4. "압축해제된 확장 프로그램을 로드합니다" 클릭
5. `dist` 폴더 선택

## 권한

이 확장 프로그램은 다음 권한을 사용합니다:

- `bookmarks`: 북마크 읽기 및 수정
- `storage`: 설정 저장
- `tabs`: 탭 정보 접근
- `host_permissions`: 북마크 URL 접근성 확인
