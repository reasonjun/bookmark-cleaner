import { Checkbox } from '@reasonjun/design-system-app';

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
  renderItem: (item: SelectableItemUnion) => React.ReactNode;
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
    <CollapsibleSection
      title={title}
      count={items.length}
      initialOpen={false}
      allChecked={allChecked}
      someChecked={someChecked}
      onSelectAllChange={onSelectAllChange}
    >
      <ul>
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
  );
};
