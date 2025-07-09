/**
 * 컴포넌트들을 위한 타입 정의
 */

import type { SelectableCleanupResult } from './bookmark';

/**
 * 탭 관련 타입
 */
export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

/**
 * 버튼 관련 타입
 */
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

/**
 * 스캔 결과 패널 관련 타입
 */
export interface ScanResultPanelProps {
  scanResult: SelectableCleanupResult | null;
  isLoading: boolean;
  onItemCheckChange: (
    category: keyof SelectableCleanupResult,
    id: string,
    isChecked: boolean
  ) => void;
}

/**
 * 선택 가능한 항목들의 공통 인터페이스
 */
export interface SelectableItem {
  isChecked: boolean;
}

/**
 * 카테고리별 아이템 타입
 */
export type CategoryItem<T extends keyof SelectableCleanupResult> =
  T extends 'emptyFolders'
    ? SelectableCleanupResult['emptyFolders'][number]
    : T extends 'duplicateUrls'
      ? SelectableCleanupResult['duplicateUrls'][number]
      : T extends 'errorPages'
        ? SelectableCleanupResult['errorPages'][number]
        : never;

/**
 * 아이템 타입 유니언
 */
export type SelectableItemUnion =
  | SelectableCleanupResult['emptyFolders'][number]
  | SelectableCleanupResult['duplicateUrls'][number]
  | SelectableCleanupResult['errorPages'][number];

/**
 * 이벤트 핸들러 타입들
 */
export type ItemCheckChangeHandler = (
  category: keyof SelectableCleanupResult,
  id: string,
  isChecked: boolean
) => void;

export type SelectAllHandler = (
  category: keyof SelectableCleanupResult,
  checked: boolean
) => void;

/**
 * 컴포넌트 상태 타입들
 */
export interface ComponentState<T = unknown> {
  isLoading: boolean;
  error: string | null;
  data: T;
}

/**
 * 폼 관련 타입들
 */
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
}

/**
 * 모달 관련 타입들
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
