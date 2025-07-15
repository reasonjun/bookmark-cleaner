import { CollapsibleSection } from '@/components';
import { ERROR_CATEGORY_ORDER } from '@/constants';
import type { SelectableCleanupResult } from '@/types/bookmark';
import { groupErrorPagesByCategory } from '@/utils/errorMessages';
import { getCheckboxState } from '@/utils/itemHelpers';

import { CategorySection } from './CategorySection';

interface ErrorPagesSectionProps {
  errorPages: SelectableCleanupResult['errorPages'];
  allChecked: boolean;
  someChecked: boolean;
  onSelectAllChange: (checked: boolean) => void;
  onItemCheckChange: (
    category: keyof SelectableCleanupResult,
    id: string,
    checked: boolean
  ) => void;
}

export const ErrorPagesSection = ({
  errorPages,
  allChecked,
  someChecked,
  onSelectAllChange,
  onItemCheckChange,
}: ErrorPagesSectionProps) => {
  if (errorPages.length === 0) {
    return (
      <CategorySection
        title="에러 페이지"
        items={[]}
        category="errorPages"
        allChecked={allChecked}
        someChecked={someChecked}
        onSelectAllChange={onSelectAllChange}
        onItemCheckChange={onItemCheckChange}
        renderItem={() => null}
      />
    );
  }

  const groupedErrors = groupErrorPagesByCategory(errorPages);
  const sortedCategories = ERROR_CATEGORY_ORDER.filter(
    category => groupedErrors[category as keyof typeof groupedErrors]
  );

  return (
    <CollapsibleSection
      title="에러 페이지"
      count={errorPages.length}
      initialOpen={false}
      allChecked={allChecked}
      someChecked={someChecked}
      onSelectAllChange={onSelectAllChange}
    >
      {sortedCategories.map(category => {
        const categoryItems =
          groupedErrors[category as keyof typeof groupedErrors];
        const categoryCheckboxState = getCheckboxState(categoryItems);

        return (
          <div key={category} className="error-category">
            <CategorySection
              title={category}
              items={categoryItems}
              category="errorPages"
              allChecked={categoryCheckboxState.allChecked}
              someChecked={categoryCheckboxState.someChecked}
              onSelectAllChange={checked => {
                categoryItems.forEach(item => {
                  onItemCheckChange('errorPages', item.bookmark.id, checked);
                });
              }}
              onItemCheckChange={onItemCheckChange}
              renderItem={item => {
                const errorItem =
                  item as SelectableCleanupResult['errorPages'][number];
                return (
                  <div className="error-page-item">
                    <a
                      href={errorItem.bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="error-page-url"
                    >
                      {errorItem.bookmark.title || errorItem.bookmark.url}
                    </a>
                    <div className="error-page-details">
                      <span className="error-message">
                        {errorItem.errorMessage ||
                          '🔗 링크에 접속할 수 없습니다'}
                      </span>
                      {errorItem.errorCode && errorItem.errorCode > 0 && (
                        <span className="error-code">
                          HTTP {errorItem.errorCode}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }}
            />
          </div>
        );
      })}
    </CollapsibleSection>
  );
};
