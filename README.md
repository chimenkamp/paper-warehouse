# Paper Warehouse

Paper Warehouse is a config-driven web application for browsing and visualizing collections of academic papers or methods. The application targets research groups and university chairs that need a static website for their publications. The stack consists of React 18, D3.js, and Vite. No backend is required. The output is a static site deployable to any web host or GitHub Pages.

## Features

- Pipeline visualization that groups entries by configurable stages
- Scatter-plot landscape view arranged by year and automation level
- Relationship graph derived from shared tags and computed similarity
- Full-text fuzzy search with configurable field weights
- Dynamic filter chips generated from data values
- Side-by-side comparison of two entries
- Dark/light theme toggle with persistence
- Single JSON config file controlling titles, labels, fields, steps, navigation, and features

## Requirements

- Node.js >= 18
- npm (included with Node.js)

## Quick Start

```
git clone <your-repo-url>
cd paper-warehouse
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

## Project Structure

```
data/
  site.config.json      Config file controlling the entire application
  methods.json          Data file (name and path are configurable)
  methods.schema.json   Optional JSON Schema for validation
public/                 Static assets (favicon, images)
src/
  App.jsx               Root component with routing
  main.jsx              Entry point
  components/           Reusable UI components
  lib/                  Data loading, config, state, filters
  styles/               CSS files with design tokens
  views/                Route-level page components
  viz/                  D3 visualization modules
scripts/
  validate-schema.js    Schema validation script
```

## Configuration

All customization happens in `data/site.config.json`. The [tutorial](tutorial.md) provides a full walkthrough.

### Sections overview

| Section | Controls |
|---|---|
| `site` | Page title, subtitle, logo text, description, favicon |
| `navigation` | Visible pages and their labels |
| `visualization` | Pipeline steps (name, order, color) and UI labels |
| `data` | Path to data file, entry key, required fields, field definitions |
| `features` | Toggle for search, compare, filters, landscape, graph, theme, stats |
| `about` | About page title, introduction, content sections |

### Minimal config example

```json
{
  "site": {
    "title": "Our Publications",
    "subtitle": "Research Group XYZ",
    "logoText": "RG"
  },
  "navigation": [
    { "label": "Papers", "path": "/", "enabled": true },
    { "label": "About", "path": "/about", "enabled": true }
  ],
  "visualization": {
    "preset": "pipeline",
    "steps": [
      { "id": "theory", "name": "Theory", "order": 1, "color": "#bf616a" },
      { "id": "experiment", "name": "Experiment", "order": 2, "color": "#a3be8c" },
      { "id": "application", "name": "Application", "order": 3, "color": "#88c0d0" }
    ],
    "labels": {
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
      { "key": "step", "type": "step", "label": "Category", "showInList": true, "showInDetail": true },
      { "key": "short_description", "type": "text", "label": "Abstract", "showInList": true, "showInDetail": true, "searchWeight": 0.3 },
      { "key": "references", "type": "reference", "label": "Reference", "showInList": true, "showInDetail": true, "subfields": ["paper_title", "authors", "venue", "year", "doi_or_url"] }
    ]
  },
  "features": {
    "search": true,
    "compare": false,
    "filters": false,
    "landscape": false,
    "graph": false,
    "themeToggle": true,
    "stats": true
  },
  "about": {
    "title": "About",
    "introduction": "Description of the research group.",
    "sections": []
  }
}
```

## Data Format

The data file is a JSON file containing metadata, pipeline steps, and entries. The following example shows the expected structure.

```json
{
  "metadata": {
    "version": "1.0",
    "lastUpdated": "2025-01-01T00:00:00Z"
  },
  "pipeline_steps": [
    { "id": "theory", "name": "Theory", "description": "...", "order": 1, "color": "#bf616a" }
  ],
  "papers": [
    {
      "id": "paper_001",
      "name": "Paper Title",
      "pipeline_step": "theory",
      "short_description": "Brief abstract or summary.",
      "references": {
        "paper_title": "Full Paper Title",
        "authors": ["Author A", "Author B"],
        "venue": "Conference 2025",
        "year": 2025,
        "doi_or_url": "https://doi.org/..."
      }
    }
  ]
}
```

The top-level key for entries (e.g. `papers`) must match `data.entryKey` in the config. The `pipeline_step` field in each entry must match a step `id` defined in `visualization.steps`.

### Field types

| Type | Stored as | Rendered as |
|---|---|---|
| `id` | string | Hidden by default |
| `text` | string | Paragraph |
| `longtext` | string | Multi-paragraph block |
| `step` | string | Colored badge matching pipeline step |
| `list` | array of strings | Bulleted list |
| `tags` | array of strings | Inline chips (optionally filterable) |
| `enum` | string | Badge (optionally filterable with defined `values`) |
| `reference` | object | Formatted citation with link |
| `links` | object | List of labeled URLs |
| `relations` | array of strings | Links to other entries by ID |

## Building for Production

The `build` command generates a static site in `dist/`.

```
npm run build
```

The `dist/` folder can be served by any static file server.

### GitHub Pages

The base path must be set via environment variable before building.

```
BASE_URL=/your-repo-name/ npm run build
```

Alternatively `site.basePath` in the config can be used together with a matching `vite.config.js` adjustment.

### Embedding in an existing site

The built output is a standard single-page application. The typical integration steps are as follows.

1. Host `dist/` at a subpath on the web server.
2. Set `BASE_URL` to that subpath when building.
3. Link to the application from the main site navigation.

## Development

The following commands are available during development.

```
npm run dev              # Start dev server with hot reload
npm run build            # Production build
npm run preview          # Preview production build locally
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix lint issues
npm run format           # Format with Prettier
npm run test             # Run tests
npm run validate:schema  # Validate data against JSON Schema
```

## Styling

The application uses a Nord-inspired color palette defined as CSS custom properties in `src/styles/tokens.css`. The theme toggle switches between light and dark mode by setting the `[data-theme="dark"]` attribute on `<html>`. Colors can be changed by editing the custom properties in `tokens.css`. Pipeline step colors are set per step in the config file.

## License

MIT License. See [LICENSE](LICENSE) for details.

