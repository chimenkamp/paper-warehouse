import { useAppState, useAppDispatch, actions, getFilterOptions, getSiteConfig, getFilterableFields } from '@/lib';

/**
 * Filter chip component
 */
function FilterChip({ label, isActive, onClick }) {
  return (
    <button
      className={`filter-chip ${isActive ? 'filter-chip--active' : ''}`}
      onClick={onClick}
      type="button"
      aria-pressed={isActive}
    >
      {label}
    </button>
  );
}

/**
 * Config-driven filters panel.
 * Renders a filter group for every field marked filterable in site.config.json.
 */
export default function FiltersPanel() {
  const { filters, allMethods, showFilters } = useAppState();
  const dispatch = useAppDispatch();

  if (!showFilters) return null;

  const config = getSiteConfig();
  const filterableFields = getFilterableFields(config);
  const filterOptions = getFilterOptions(allMethods);

  const toggleArrayFilter = (filterName, value) => {
    const current = filters[filterName] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    dispatch(actions.setFilters({ [filterName]: updated }));
  };

  const hasActiveFilters = filterableFields.some((f) => {
    const val = filters[f.key];
    return val && (Array.isArray(val) ? val.length > 0 : !!val);
  });

  return (
    <div className="filters-panel animate-slide-up">
      <div className="filters-panel__header">
        <h2 className="filters-panel__title">Filters</h2>
        {hasActiveFilters && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => dispatch(actions.resetFilters())}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="filters-panel__grid">
        {filterableFields.map((field) => {
          const options = filterOptions[field.key] || [];
          if (options.length === 0) return null;

          return (
            <div className="filters-panel__group" key={field.key}>
              <label className="filters-panel__label">{field.label}</label>
              <div className="filters-panel__chips">
                {options.map((opt) => (
                  <FilterChip
                    key={opt}
                    label={opt}
                    isActive={(filters[field.key] || []).includes(opt)}
                    onClick={() => toggleArrayFilter(field.key, opt)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
