/**
 * Site configuration loader
 *
 * Loads and merges site.config.json with sensible defaults.
 * All components read layout, labels, field definitions, and
 * feature flags from the resolved config object.
 */

const BASE_PATH = import.meta.env.BASE_URL || '/';

let cachedConfig = null;

/** Minimal default config used when keys are missing from the user file. */
const DEFAULT_CONFIG = {
  site: {
    title: 'Paper Warehouse',
    subtitle: '',
    logoText: 'PE',
    description: '',
    favicon: '/favicon.svg',
    footer: '',
    basePath: '/',
  },
  navigation: [
    { label: 'Explorer', path: '/', enabled: true },
    { label: 'Graph', path: '/relationships', enabled: true },
    { label: 'About', path: '/about', enabled: true },
  ],
  visualization: {
    preset: 'pipeline',
    steps: [],
    labels: {
      stepsTitle: 'Overview',
      stepsHint: 'Click a step to filter entries',
      landscapeTitle: 'Landscape',
      landscapeDescription: 'Explore entries by year.',
      graphTitle: 'Relationship Graph',
      graphDescription: 'Explore connections between entries.',
      entrySingular: 'entry',
      entryPlural: 'entries',
    },
  },
  data: {
    file: 'data/methods.json',
    entryKey: 'methods',
    requiredFields: ['id', 'name', 'step', 'short_description', 'references'],
    fields: [],
    sort: { default: 'name', options: ['name', 'year'] },
  },
  features: {
    search: true,
    compare: true,
    filters: true,
    landscape: true,
    graph: true,
    themeToggle: true,
    stats: true,
  },
  about: {
    title: 'About',
    introduction: '',
    sections: [],
  },
};

/**
 * Deep-merge two objects. Arrays are replaced, not concatenated.
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Loads site.config.json and merges with defaults.
 * @returns {Promise<Object>} Resolved site configuration
 */
export async function loadSiteConfig() {
  if (cachedConfig) return cachedConfig;

  try {
    const response = await fetch(`${BASE_PATH}data/site.config.json`);
    if (!response.ok) {
      console.warn('site.config.json not found, using defaults');
      cachedConfig = { ...DEFAULT_CONFIG };
      return cachedConfig;
    }
    const userConfig = await response.json();
    cachedConfig = deepMerge(DEFAULT_CONFIG, userConfig);
    return cachedConfig;
  } catch (error) {
    console.warn('Error loading site.config.json, using defaults:', error);
    cachedConfig = { ...DEFAULT_CONFIG };
    return cachedConfig;
  }
}

/**
 * Returns the cached config synchronously.
 * Must call loadSiteConfig() first during app init.
 * @returns {Object|null}
 */
export function getSiteConfig() {
  return cachedConfig;
}

/**
 * Resolve the step field from a data entry.
 * The config may declare a sourceField (e.g. "pipeline_step") that
 * maps to the canonical "step" key used internally.
 */
export function resolveStepField(config) {
  const stepField = config?.data?.fields?.find((f) => f.type === 'step');
  return stepField?.sourceField || stepField?.key || 'pipeline_step';
}

/**
 * Get field config by key
 */
export function getFieldConfig(config, key) {
  return config?.data?.fields?.find((f) => f.key === key) || null;
}

/**
 * Get all filterable fields from config
 */
export function getFilterableFields(config) {
  return (config?.data?.fields || []).filter((f) => f.filterable);
}

/**
 * Get all fields that should appear in the list view
 */
export function getListFields(config) {
  return (config?.data?.fields || []).filter((f) => f.showInList);
}

/**
 * Get all fields that should appear in the detail view
 */
export function getDetailFields(config) {
  return (config?.data?.fields || []).filter((f) => f.showInDetail);
}

/**
 * Get search-weighted fields for Fuse.js
 */
export function getSearchFields(config) {
  return (config?.data?.fields || [])
    .filter((f) => f.searchWeight)
    .map((f) => ({
      name: f.key === 'references' ? 'references.paper_title' : f.key,
      weight: f.searchWeight,
    }));
}

/**
 * Check whether a feature is enabled
 */
export function isFeatureEnabled(config, featureName) {
  return config?.features?.[featureName] !== false;
}

/**
 * Get visualization labels
 */
export function getLabels(config) {
  return config?.visualization?.labels || DEFAULT_CONFIG.visualization.labels;
}

/**
 * Get step definitions from config
 */
export function getSteps(config) {
  return config?.visualization?.steps || [];
}

/**
 * Build a color map from step definitions: { stepId: color }
 */
export function getStepColorMap(config) {
  const map = {};
  (config?.visualization?.steps || []).forEach((s) => {
    map[s.id] = s.color || '#88c0d0';
  });
  return map;
}
