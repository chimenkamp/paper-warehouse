# Tutorial: Setting Up Paper Warehouse

This tutorial covers every step for configuring Paper Warehouse for a research group. The result is a working site with custom data, labels, and layout.

## Table of Contents

1. [Install and run](#1-install-and-run)
2. [Understand the config file](#2-understand-the-config-file)
3. [Set site metadata](#3-set-site-metadata)
4. [Define pipeline steps](#4-define-pipeline-steps)
5. [Create the data file](#5-create-the-data-file)
6. [Configure fields](#6-configure-fields)
7. [Add filterable and searchable fields](#7-add-filterable-and-searchable-fields)
8. [Configure navigation and features](#8-configure-navigation-and-features)
9. [Write the about page](#9-write-the-about-page)
10. [Customize labels](#10-customize-labels)
11. [Deploy](#11-deploy)
12. [Advanced: multiple field types](#12-advanced-multiple-field-types)

---

## 1. Install and run

```
git clone <your-repo-url>
cd paper-warehouse
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`. Source file changes trigger an automatic reload. Changes to `data/site.config.json` and the data JSON file also reload automatically because Vite serves them from the project root.

## 2. Understand the config file

The file `data/site.config.json` controls the entire application. This single file defines the page title, branding, navigation items, pipeline steps, data source, field definitions, enabled features, and about page content.

The application loads this config first on startup. It then loads the data file specified by `data.file`.

## 3. Set site metadata

The `site` section controls the page header and HTML metadata.

```json
{
  "site": {
    "title": "NLP Methods",
    "subtitle": "Chair of Computational Linguistics",
    "logoText": "CL",
    "description": "Interactive browser for NLP methods from our research group.",
    "favicon": "/favicon.svg",
    "footer": "",
    "basePath": "/"
  }
}
```

| Key | Purpose |
|---|---|
| `title` | Main heading in the header and browser tab |
| `subtitle` | Second line in the header |
| `logoText` | Short text in the logo area (1-3 characters) |
| `description` | HTML meta description |
| `favicon` | Path to favicon relative to `public/` |
| `basePath` | URL prefix when hosted at a subpath |

## 4. Define pipeline steps

Steps are the primary grouping for entries. They appear as colored cards at the top of the home page. Each entry belongs to exactly one step.

```json
{
  "visualization": {
    "preset": "pipeline",
    "steps": [
      {
        "id": "data_collection",
        "name": "Data Collection",
        "description": "Methods for gathering and curating datasets",
        "order": 1,
        "color": "#bf616a"
      },
      {
        "id": "model_training",
        "name": "Model Training",
        "description": "Training and fine-tuning approaches",
        "order": 2,
        "color": "#a3be8c"
      },
      {
        "id": "evaluation",
        "name": "Evaluation",
        "description": "Benchmarks and evaluation protocols",
        "order": 3,
        "color": "#88c0d0"
      }
    ]
  }
}
```

The following rules apply to step definitions.

- The `id` must be a unique string without spaces. Underscores are permitted.
- The `order` value controls left-to-right display order.
- The `color` value accepts any CSS color. The Nord aurora palette works well: `#bf616a`, `#d08770`, `#ebcb8b`, `#a3be8c`, `#b48ead`, `#88c0d0`.
- The number of steps is unrestricted. However 3-8 steps work best visually.

## 5. Create the data file

The data file is a JSON file stored in `data/`. The default path is `data/methods.json`. A different name can be used by setting `data.file` in the config.

The following example shows the expected structure.

```json
{
  "metadata": {
    "version": "1.0",
    "lastUpdated": "2025-06-01T00:00:00Z"
  },
  "pipeline_steps": [
    {
      "id": "data_collection",
      "name": "Data Collection",
      "description": "Methods for gathering and curating datasets",
      "order": 1,
      "color": "#bf616a"
    }
  ],
  "papers": [
    {
      "id": "paper_001",
      "name": "A Survey of Dataset Curation Methods",
      "pipeline_step": "data_collection",
      "short_description": "Comprehensive overview of techniques for building NLP datasets.",
      "references": {
        "paper_title": "A Survey of Dataset Curation Methods",
        "authors": ["A. Smith", "B. Jones"],
        "venue": "ACL 2024",
        "year": 2024,
        "doi_or_url": "https://doi.org/10.xxxx/xxxxx"
      }
    }
  ]
}
```

Please note that the following constraints apply.

- The `pipeline_steps` array in the data file serves as a fallback. The config's `visualization.steps` takes priority. Both can be kept in sync or steps can be defined only in the config.
- The top-level key for entries (e.g. `papers`) must match `data.entryKey` in the config.
- Each entry's `pipeline_step` value must match one of the step `id` values.

The config must point to the data file as follows.

```json
{
  "data": {
    "file": "data/papers.json",
    "entryKey": "papers"
  }
}
```

## 6. Configure fields

The `data.fields` array defines what fields exist in the data and how to display them. Each field definition follows this structure.

```json
{
  "key": "name",
  "type": "text",
  "label": "Title",
  "showInList": true,
  "showInDetail": true,
  "searchWeight": 0.4
}
```

| Property | Type | Purpose |
|---|---|---|
| `key` | string | Matches the JSON key in data entries |
| `type` | string | One of: `id`, `text`, `longtext`, `step`, `list`, `tags`, `enum`, `reference`, `links`, `relations` |
| `label` | string | Display name in the UI |
| `showInList` | boolean | Show in entry list/cards on the home page |
| `showInDetail` | boolean | Show on the entry detail page |
| `filterable` | boolean | Generate filter chips for this field |
| `searchWeight` | number | Weight for fuzzy search (0.0 to 1.0; higher means more important) |
| `values` | array | Allowed values for `enum` type |
| `subfields` | array | Keys inside the nested object for `reference` and `links` types |
| `sourceField` | string | Maps to a different key in the data (e.g. `"sourceField": "pipeline_step"` when the data uses `pipeline_step` but the config field key is `step`) |

The `data.requiredFields` array lists mandatory fields. Entries missing these fields produce console warnings during validation but still load.

### Minimal field set

The application requires at minimum the following fields.

```json
{
  "data": {
    "requiredFields": ["id", "name", "step", "short_description", "references"],
    "fields": [
      { "key": "id", "type": "id", "label": "ID" },
      { "key": "name", "type": "text", "label": "Title", "showInList": true, "showInDetail": true, "searchWeight": 0.4 },
      { "key": "step", "type": "step", "label": "Category", "sourceField": "pipeline_step", "showInList": true, "showInDetail": true },
      { "key": "short_description", "type": "text", "label": "Description", "showInList": true, "showInDetail": true, "searchWeight": 0.2 },
      { "key": "references", "type": "reference", "label": "Reference", "showInList": true, "showInDetail": true, "subfields": ["paper_title", "authors", "venue", "year", "doi_or_url"] }
    ]
  }
}
```

### Adding more fields

Additional fields can be added by appending to the `fields` array and adding the corresponding data to entries. For example the following adds a keywords field.

Config:
```json
{ "key": "keywords", "type": "tags", "label": "Keywords", "showInList": false, "showInDetail": true, "filterable": true, "searchWeight": 0.15 }
```

Data entry:
```json
{
  "id": "paper_001",
  "keywords": ["transformers", "attention", "NLP"]
}
```

The `filterable: true` flag causes the home page to show filter chips for all distinct keyword values found in the data.

## 7. Add filterable and searchable fields

### Filterable fields

Any field with `"filterable": true` generates filter chips on the home page. The application reads all distinct values from the data and displays them as chips.

This mechanism works with the following types.

- `tags`: Each array item becomes a chip.
- `enum`: Each distinct value becomes a chip.

### Searchable fields

Any field with a `searchWeight` value is included in the fuzzy search index. The weight controls how much a match in that field influences result ranking.

The following ranges are typical.

- Title/name: 0.3 - 0.5
- Description: 0.15 - 0.3
- Tags/keywords: 0.1 - 0.2
- Authors (nested in references): 0.05 - 0.1

The search uses Fuse.js. It matches partial strings and tolerates typos.

## 8. Configure navigation and features

### Navigation

The `navigation` array defines visible pages.

```json
{
  "navigation": [
    { "label": "Explorer", "path": "/", "enabled": true },
    { "label": "Graph", "path": "/relationships", "enabled": true },
    { "label": "About", "path": "/about", "enabled": true }
  ]
}
```

Setting `enabled` to `false` hides a nav item without deleting it. The available paths are listed below.

| Path | Page |
|---|---|
| `/` | Home page with pipeline, filters, and entry list |
| `/relationships` | Relationship graph visualization |
| `/about` | About page |

### Features

The `features` object toggles UI elements on or off.

```json
{
  "features": {
    "search": true,
    "compare": true,
    "filters": true,
    "landscape": true,
    "graph": true,
    "themeToggle": true,
    "stats": true
  }
}
```

Any feature set to `false` hides its corresponding UI elements. For example the landscape and graph views can be disabled when the data does not contain enough fields to make them useful.

## 9. Write the about page

The `about` section defines the content of the about page.

```json
{
  "about": {
    "title": "About This Collection",
    "introduction": "This page collects methods and tools from our research group's work on computational linguistics.",
    "sections": [
      {
        "title": "Categories",
        "content": "We organize our work into three main categories.",
        "showSteps": true
      },
      {
        "title": "Contact",
        "content": "For questions, contact us at chair@university.edu."
      }
    ]
  }
}
```

The `showSteps: true` flag renders the pipeline steps with their descriptions and colors inside that section. Sections without this flag render as plain text.

## 10. Customize labels

The `visualization.labels` section controls UI text throughout the application.

```json
{
  "visualization": {
    "labels": {
      "stepsTitle": "Research Areas",
      "stepsHint": "Click an area to filter",
      "landscapeTitle": "Publication Landscape",
      "landscapeDescription": "Explore papers by year and automation level.",
      "graphTitle": "Relationship Graph",
      "graphDescription": "Connections between papers based on shared keywords.",
      "entrySingular": "paper",
      "entryPlural": "papers"
    }
  }
}
```

The `entrySingular` and `entryPlural` values appear in counts, search placeholders, and headings. For example the application displays "42 papers found" or "Search papers..." based on these values.

## 11. Deploy

### Local preview

```
npm run build
npm run preview
```

### GitHub Pages

First set the base path. Then push the `dist/` folder to a `gh-pages` branch or configure GitHub Actions to build and deploy.

```
BASE_URL=/your-repo-name/ npm run build
```

### Any static host

The contents of `dist/` can be uploaded to any web server. The `BASE_URL` must be set to the subpath when the site is hosted at a subpath (e.g. `https://university.edu/chair/papers/` requires `BASE_URL=/chair/papers/`).

### Embedding in a university website

The output is a self-contained single-page application. The following integration approaches are common.

1. **Subpath hosting**: Place `dist/` at a subpath on the existing web server and link to it from the navigation.
2. **Iframe**: Embed with `<iframe src="/papers/" width="100%" height="800"></iframe>`.
3. **Subdomain**: Host at `papers.chair.university.edu`.

## 12. Advanced: multiple field types

### reference

The `reference` type stores citation data as a nested object. The application renders it as a formatted citation with an optional DOI/URL link.

Config:
```json
{ "key": "references", "type": "reference", "label": "Reference", "showInDetail": true, "subfields": ["paper_title", "authors", "venue", "year", "doi_or_url"] }
```

Data:
```json
{
  "references": {
    "paper_title": "Full Title",
    "authors": ["A. Author", "B. Author"],
    "venue": "ICSE 2025",
    "year": 2025,
    "doi_or_url": "https://doi.org/..."
  }
}
```

### links

The `links` type stores a set of named URLs. The application renders them as labeled links.

Config:
```json
{ "key": "artifacts", "type": "links", "label": "Artifacts", "showInDetail": true, "subfields": ["code_url", "dataset_url", "demo_url"] }
```

Data:
```json
{
  "artifacts": {
    "code_url": "https://github.com/...",
    "dataset_url": "https://zenodo.org/...",
    "demo_url": ""
  }
}
```

Empty strings are skipped in the display.

### relations

The `relations` type links to other entries by their `id`. The application renders them as clickable links to the detail pages.

Config:
```json
{ "key": "related_paper_ids", "type": "relations", "label": "Related Papers", "showInDetail": true }
```

Data:
```json
{
  "related_paper_ids": ["paper_002", "paper_005"]
}
```

### enum

The `enum` type stores a single value from a predefined set. It can be made filterable.

Config:
```json
{ "key": "status", "type": "enum", "label": "Status", "showInDetail": true, "filterable": true, "values": ["draft", "published", "archived"] }
```

Data:
```json
{
  "status": "published"
}
```

### tags

The `tags` type stores an array of free-form strings. It can be made filterable and searchable.

Config:
```json
{ "key": "topics", "type": "tags", "label": "Topics", "showInList": true, "showInDetail": true, "filterable": true, "searchWeight": 0.15 }
```

Data:
```json
{
  "topics": ["deep learning", "reinforcement learning", "robotics"]
}
```

---

## Complete example config

The following config is a minimal setup for a research group publishing NLP papers with three categories.

```json
{
  "site": {
    "title": "NLP Publications",
    "subtitle": "Computational Linguistics Group",
    "logoText": "CL"
  },
  "navigation": [
    { "label": "Papers", "path": "/", "enabled": true },
    { "label": "About", "path": "/about", "enabled": true }
  ],
  "visualization": {
    "preset": "pipeline",
    "steps": [
      { "id": "analysis", "name": "Analysis", "description": "Text analysis methods", "order": 1, "color": "#bf616a" },
      { "id": "generation", "name": "Generation", "description": "Text generation methods", "order": 2, "color": "#a3be8c" },
      { "id": "evaluation", "name": "Evaluation", "description": "Evaluation frameworks", "order": 3, "color": "#88c0d0" }
    ],
    "labels": {
      "stepsTitle": "Research Areas",
      "stepsHint": "Click to filter by area",
      "entrySingular": "paper",
      "entryPlural": "papers"
    }
  },
  "data": {
    "file": "data/papers.json",
    "entryKey": "papers",
    "requiredFields": ["id", "name", "step", "short_description", "references"],
    "fields": [
      { "key": "id", "type": "id", "label": "ID" },
      { "key": "name", "type": "text", "label": "Title", "showInList": true, "showInDetail": true, "searchWeight": 0.4 },
      { "key": "step", "type": "step", "label": "Area", "sourceField": "pipeline_step", "showInList": true, "showInDetail": true },
      { "key": "short_description", "type": "text", "label": "Abstract", "showInList": true, "showInDetail": true, "searchWeight": 0.3 },
      { "key": "topics", "type": "tags", "label": "Topics", "showInList": true, "showInDetail": true, "filterable": true, "searchWeight": 0.15 },
      { "key": "references", "type": "reference", "label": "Reference", "showInList": true, "showInDetail": true, "subfields": ["paper_title", "authors", "venue", "year", "doi_or_url"] },
      { "key": "artifacts", "type": "links", "label": "Links", "showInDetail": true, "subfields": ["code_url", "dataset_url"] }
    ]
  },
  "features": {
    "search": true,
    "compare": false,
    "filters": true,
    "landscape": false,
    "graph": false,
    "themeToggle": true,
    "stats": true
  },
  "about": {
    "title": "About",
    "introduction": "Publications from the Computational Linguistics Group at Example University.",
    "sections": [
      { "title": "Research Areas", "content": "Our work spans three main areas.", "showSteps": true }
    ]
  }
}
```
