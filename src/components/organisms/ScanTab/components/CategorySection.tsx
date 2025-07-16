import { Checkbox } from '@reasonjun/design-system-app';
import type { ReactNode } from 'react';

import { CollapsibleSection, Section } from '@/components';
import type { SelectableCleanupResult } from '@/types/bookmark';
import type { SelectableItemUnion } from '@/types/components';
import { getItemId } from '@/utils/itemHelpers';

interface CategorySectionProps {
  title: string;
  items: SelectableItemUnion[];
  category: keyof SelectableCleanupResult;
  allChecked: boolean;
  someChecked: boolean;
  onSelectAllChange: (checked: boolean) => void;
  onItemCheckChange: (
    category: keyof SelectableCleanupResult,
    id: string,
    checked: boolean
  ) => void;
  renderItem: (item: SelectableItemUnion) => ReactNode;
}

export const CategorySection = ({
  title,
  items,
  category,
  allChecked,
  someChecked,
  onSelectAllChange,
  onItemCheckChange,
  renderItem,
}: CategorySectionProps) => {
  const sectionId = `section-${category}`;
  const descriptionId = `description-${category}`;

  const getDescription = () => {
    switch (category) {
      case 'emptyFolders':
        return '선택한 빈 폴더들이 북마크에서 삭제됩니다.';
      case 'duplicateUrls':
        return '선택한 중복 URL의 추가 북마크들이 삭제되고 하나만 남겨집니다.';
      case 'errorPages':
        return '선택한 접속 불가능한 페이지들이 북마크에서 삭제됩니다.';
      default:
        return '선택한 항목들이 정리됩니다.';
    }
  };

  if (items.length === 0) {
    return (
      <Section
        title={title}
        count={items.length}
        allChecked={allChecked}
        someChecked={someChecked}
        onSelectAllChange={onSelectAllChange}
      />
    );
  }

  return (
    <div id={sectionId}>
      <CollapsibleSection
        title={title}
        count={items.length}
        initialOpen={false}
        allChecked={allChecked}
        someChecked={someChecked}
        onSelectAllChange={onSelectAllChange}
      >
        <p id={descriptionId} className="category-description">
          {getDescription()}
        </p>
        <ul aria-describedby={descriptionId}>
          {items.map(item => (
            <li key={getItemId(item, category)}>
              <label className="category-item-label">
                <Checkbox
                  checked={item.isChecked}
                  onChange={e =>
                    onItemCheckChange(
                      category,
                      getItemId(item, category),
                      e.target.checked
                    )
                  }
                />
                {renderItem(item)}
              </label>
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </div>
  );
};
