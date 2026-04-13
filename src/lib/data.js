import { getSiteConfig, resolveStepField } from './config';

/**
 * Data loading utilities — config-driven.
 *
 * The data file path and entry key come from site.config.json.
 * Validation only checks the required fields declared in the config;
 * every other field is optional and rendered dynamically.
 */

const BASE_PATH = import.meta.env.BASE_URL || '/';

let cachedData = null;

/**
 * Loads the data file declared in site.config.json
 * @returns {Promise<Object>} The loaded data
 */
export async function loadMethodsData() {
  if (cachedData) return cachedData;

  const config = getSiteConfig();
  const dataFile = config?.data?.file || 'data/methods.json';

  try {
    const response = await fetch(`${BASE_PATH}${dataFile}`);
    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.status}`);
    }
    const data = await response.json();
    cachedData = data;
    return data;
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
}

/**
 * Validates data against the required fields from config.
 * @param {Object} data
 * @returns {Object} { isValid, errors }
 */
export function validateMethodsData(data) {
  const config = getSiteConfig();
  const entryKey = config?.data?.entryKey || 'methods';
  const stepFieldName = resolveStepField(config);
  const errors = [];

  if (!data.metadata) {
    errors.push('Missing metadata object');
  }

  const entries = data[entryKey];
  if (!entries || !Array.isArray(entries)) {
    errors.push(`Missing or invalid "${entryKey}" array`);
    return { isValid: false, errors };
  }

  const requiredFields = config?.data?.requiredFields || ['id', 'name', 'step', 'short_description', 'references'];
  const mappedRequired = requiredFields.map((f) => (f === 'step' ? stepFieldName : f));
  const validStepIds = (config?.visualization?.steps || []).map((s) => s.id);

  entries.forEach((entry, index) => {
    mappedRequired.forEach((field) => {
      if (entry[field] === undefined) {
        errors.push(`Entry ${index} (${entry.id || 'unknown'}): missing required field "${field}"`);
      }
    });

    if (validStepIds.length > 0 && entry[stepFieldName] && !validStepIds.includes(entry[stepFieldName])) {
      errors.push(`Entry ${entry.id}: invalid step "${entry[stepFieldName]}"`);
    }

    const duplicates = entries.filter((e) => e.id === entry.id);
    if (duplicates.length > 1) {
      errors.push(`Duplicate entry ID: ${entry.id}`);
    }
  });

  return { isValid: errors.length === 0, errors };
}

/**
 * Gets the array of entries from the data using the configured key.
 */
export function getEntries(data) {
  const config = getSiteConfig();
  const entryKey = config?.data?.entryKey || 'methods';
  return data?.[entryKey] || [];
}

/**
 * Gets entry by ID
 */
export function getMethodById(data, id) {
  return getEntries(data).find((m) => m.id === id) || null;
}

/**
 * Gets pipeline step definition by ID (from data or config).
 */
export function getPipelineStepById(data, id) {
  if (data?.pipeline_steps) {
    const found = data.pipeline_steps.find((s) => s.id === id);
    if (found) return found;
  }
  const config = getSiteConfig();
  return (config?.visualization?.steps || []).find((s) => s.id === id) || null;
}

/**
 * Returns the step field value for a given entry.
 */
export function getEntryStep(entry) {
  const config = getSiteConfig();
  const stepFieldName = resolveStepField(config);
  return entry?.[stepFieldName] || null;
}

/**
 * Gets related entries for a given entry.
 */
export function getRelatedMethods(data, entryId) {
  const entries = getEntries(data);
  const entry = entries.find((m) => m.id === entryId);
  if (!entry) return [];

  const config = getSiteConfig();
  const stepFieldName = resolveStepField(config);
  const related = [];

  if (entry.related_method_ids) {
    entry.related_method_ids.forEach((id) => {
      const rel = entries.find((m) => m.id === id);
      if (rel) related.push({ ...rel, relationship: 'linked' });
    });
  }

  entries
    .filter((m) => m.id !== entryId && m[stepFieldName] === entry[stepFieldName])
    .slice(0, 3)
    .forEach((m) => {
      if (!related.find((r) => r.id === m.id)) {
        related.push({ ...m, relationship: 'same-step' });
      }
    });

  const entryTags = new Set(entry.tags || []);
  entries
    .filter((m) => m.id !== entryId)
    .map((m) => ({
      ...m,
      sharedTags: (m.tags || []).filter((t) => entryTags.has(t)).length,
    }))
    .filter((m) => m.sharedTags > 0)
    .sort((a, b) => b.sharedTags - a.sharedTags)
    .slice(0, 3)
    .forEach((m) => {
      if (!related.find((r) => r.id === m.id)) {
        related.push({ ...m, relationship: 'shared-tags' });
      }
    });

  return related.slice(0, 6);
}

/**
 * Creates aggregated statistics from data.
 */
export function getStatistics(data) {
  const config = getSiteConfig();
  const entries = getEntries(data);
  const stepFieldName = resolveStepField(config);

  const stepCounts = {};
  const yearCounts = {};

  const filterableFields = (config?.data?.fields || []).filter(
    (f) => f.filterable && (f.type === 'tags' || f.type === 'enum')
  );
  const fieldCounts = {};
  filterableFields.forEach((f) => {
    fieldCounts[f.key] = {};
  });

  entries.forEach((entry) => {
    const stepVal = entry[stepFieldName];
    if (stepVal) stepCounts[stepVal] = (stepCounts[stepVal] || 0) + 1;

    filterableFields.forEach((f) => {
      const val = entry[f.key];
      if (Array.isArray(val)) {
        val.forEach((v) => {
          fieldCounts[f.key][v] = (fieldCounts[f.key][v] || 0) + 1;
        });
      } else if (val) {
        fieldCounts[f.key][val] = (fieldCounts[f.key][val] || 0) + 1;
      }
    });

    const year = entry.references?.year;
    if (year) yearCounts[year] = (yearCounts[year] || 0) + 1;
  });

  return {
    totalEntries: entries.length,
    stepCounts,
    fieldCounts,
    yearCounts,
  };
}
