import Fuse from 'fuse.js';
import { getSiteConfig, resolveStepField, getSearchFields, getFilterableFields } from './config';

/**
 * Filter and search utilities — config-driven.
 *
 * Filter keys, tag-type fields, and search weights are all
 * derived from site.config.json at runtime.
 */

/**
 * Build default filter values from config.
 */
export function buildFilterDefaults() {
  const config = getSiteConfig();
  const stepFieldName = resolveStepField(config);
  const defaults = {
    [stepFieldName]: null,
    searchQuery: '',
    yearRange: { min: null, max: null },
  };

  // Add a default empty array for each filterable tags/enum field
  const filterableFields = getFilterableFields(config);
  filterableFields.forEach((f) => {
    if (f.type === 'tags' || f.type === 'enum') {
      defaults[f.key] = [];
    }
  });

  return defaults;
}

// Legacy export — computed once after config is loaded, then cached.
let _cachedDefaults = null;
export function getFilterDefaults() {
  if (!_cachedDefaults) _cachedDefaults = buildFilterDefaults();
  return _cachedDefaults;
}
export const FILTER_DEFAULTS = new Proxy({}, {
  get(_, prop) {
    return getFilterDefaults()[prop];
  },
  ownKeys() {
    return Object.keys(getFilterDefaults());
  },
  getOwnPropertyDescriptor(_, prop) {
    if (prop in getFilterDefaults()) {
      return { configurable: true, enumerable: true, value: getFilterDefaults()[prop] };
    }
  },
});

/**
 * Creates a Fuse.js search instance using config-defined weights.
 */
export function createSearchIndex(entries) {
  const config = getSiteConfig();
  let keys = getSearchFields(config);

  if (keys.length === 0) {
    keys = [
      { name: 'name', weight: 0.4 },
      { name: 'short_description', weight: 0.2 },
      { name: 'tags', weight: 0.2 },
    ];
  }

  return new Fuse(entries, {
    keys,
    threshold: 0.4,
    ignoreLocation: true,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
  });
}

/**
 * Fuzzy search on entries.
 */
export function searchMethods(searchIndex, query) {
  if (!query || query.trim().length < 2) return null;

  const results = searchIndex.search(query.trim());
  return results.map((result) => ({
    ...result.item,
    searchScore: result.score,
    searchMatches: result.matches,
  }));
}

/**
 * Filters entries based on active filter criteria.
 */
export function filterMethods(entries, filters) {
  const config = getSiteConfig();
  const stepFieldName = resolveStepField(config);
  const filterableFields = getFilterableFields(config);

  return entries.filter((entry) => {
    // Step filter
    const stepFilter = filters[stepFieldName] || filters.pipelineStep;
    if (stepFilter && entry[stepFieldName] !== stepFilter) return false;

    // Dynamic filterable fields
    for (const f of filterableFields) {
      const filterVal = filters[f.key];
      if (!filterVal || (Array.isArray(filterVal) && filterVal.length === 0)) continue;

      const entryVal = entry[f.key];
      if (f.type === 'tags') {
        // OR logic: entry must have at least one selected tag
        if (Array.isArray(entryVal)) {
          if (!entryVal.some((v) => filterVal.includes(v))) return false;
        } else {
          if (!filterVal.includes(entryVal)) return false;
        }
      } else if (f.type === 'enum') {
        if (Array.isArray(filterVal)) {
          if (!filterVal.includes(entryVal)) return false;
        } else if (filterVal !== entryVal) {
          return false;
        }
      }
    }

    // Year range filter
    if (filters.yearRange) {
      const year = entry.references?.year;
      if (filters.yearRange.min && year < filters.yearRange.min) return false;
      if (filters.yearRange.max && year > filters.yearRange.max) return false;
    }

    return true;
  });
}

/**
 * Combines search and filter operations.
 */
export function applyFiltersAndSearch(entries, searchIndex, filters) {
  let result = entries;

  if (filters.searchQuery && filters.searchQuery.trim().length >= 2) {
    const searchResults = searchMethods(searchIndex, filters.searchQuery);
    if (searchResults) result = searchResults;
  }

  result = filterMethods(result, filters);
  return result;
}

/**
 * Computes available filter options from the current entries.
 */
export function getFilterOptions(entries) {
  const config = getSiteConfig();
  const filterableFields = getFilterableFields(config);
  const years = new Set();
  const options = {};

  filterableFields.forEach((f) => {
    options[f.key] = new Set();
  });

  entries.forEach((entry) => {
    filterableFields.forEach((f) => {
      const val = entry[f.key];
      if (Array.isArray(val)) {
        val.forEach((v) => options[f.key].add(v));
      } else if (val) {
        options[f.key].add(val);
      }
    });
    if (entry.references?.year) years.add(entry.references.year);
  });

  const result = {};
  filterableFields.forEach((f) => {
    if (f.values && f.values.length > 0) {
      // Respect declared order
      result[f.key] = f.values.filter((v) => options[f.key].has(v));
    } else {
      result[f.key] = Array.from(options[f.key]).sort();
    }
  });

  const yearsArray = Array.from(years).sort((a, b) => a - b);
  result.yearRange = {
    min: yearsArray[0] || 2010,
    max: yearsArray[yearsArray.length - 1] || new Date().getFullYear(),
  };

  return result;
}

/**
 * Sorts entries by various criteria.
 */
export function sortMethods(entries, sortBy = 'name', order = 'asc') {
  const sorted = [...entries];

  sorted.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '');
        break;
      case 'year':
        comparison = (a.references?.year || 0) - (b.references?.year || 0);
        break;
      case 'maturity': {
        const maturityOrder = { research: 0, emerging: 1, established: 2, mature: 3 };
        comparison = (maturityOrder[a.maturity] || 0) - (maturityOrder[b.maturity] || 0);
        break;
      }
      case 'searchScore':
        comparison = (a.searchScore || 1) - (b.searchScore || 1);
        break;
      default: {
        // Generic string comparison
        const aVal = a[sortBy] || '';
        const bVal = b[sortBy] || '';
        comparison = String(aVal).localeCompare(String(bVal));
      }
    }
    return order === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Gets counts per step.
 */
export function getStepCounts(entries) {
  const config = getSiteConfig();
  const stepFieldName = resolveStepField(config);
  const counts = {};
  entries.forEach((entry) => {
    const step = entry[stepFieldName];
    if (step) counts[step] = (counts[step] || 0) + 1;
  });
  return counts;
}
