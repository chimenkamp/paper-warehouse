import { Link } from 'react-router-dom';
import { Header, RelationshipGraph, FiltersPanel } from '@/components';
import { useAppState, useAppDispatch, actions, getStatistics, getSiteConfig, isFeatureEnabled, getLabels } from '@/lib';

/**
 * Relationship graph page
 */
export default function RelationshipPage() {
  const { loading, error, data, showFilters, filteredMethods } = useAppState();
  const dispatch = useAppDispatch();
  const config = getSiteConfig();
  const labels = getLabels(config);

  if (loading) {
    return (
      <div className="main-layout">
        <Header />
        <main className="main-content">
          <div className="loading">
            <div className="loading__spinner" />
            <p>Loading graph...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-layout">
        <Header />
        <main className="main-content">
          <div className="error">
            <h2>Error Loading Data</h2>
            <p>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  const stats = data ? getStatistics(data) : null;
  const entryCount = filteredMethods?.length || stats?.totalEntries || 0;

  return (
    <div className="main-layout">
      <Header />
      <main className="relationship-page">
        <div className="relationship-page__header">
          <div className="relationship-page__title-row">
            <Link to="/" className="relationship-page__back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Explorer
            </Link>
            <h1 className="t-page-title">{labels.graphTitle || 'Relationship Graph'}</h1>
            <p className="relationship-page__subtitle">
              {labels.graphDescription || `Explore connections between ${entryCount} entries.`}
            </p>
          </div>

          <div className="relationship-page__actions">
            {isFeatureEnabled(config, 'filters') && (
              <button
                className={`btn ${showFilters ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => dispatch(actions.toggleFilters())}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filters
                {filteredMethods && filteredMethods.length !== stats?.totalEntries && (
                  <span className="relationship-page__filter-badge">
                    {filteredMethods.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="relationship-page__filters">
            <FiltersPanel />
          </div>
        )}

        <div className="relationship-page__info-cards">
          <div className="relationship-page__info-card">
            <div className="relationship-page__info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <div className="relationship-page__info-content">
              <h3>Drag &amp; Zoom</h3>
              <p>Drag nodes to rearrange. Scroll to zoom. Pan with mouse.</p>
            </div>
          </div>

          <div className="relationship-page__info-card">
            <div className="relationship-page__info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="relationship-page__info-content">
              <h3>Clusters</h3>
              <p>Entries are grouped by step. Hulls show cluster boundaries.</p>
            </div>
          </div>

          <div className="relationship-page__info-card">
            <div className="relationship-page__info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="6" y1="3" x2="6" y2="15" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M18 9a9 9 0 0 1-9 9" />
              </svg>
            </div>
            <div className="relationship-page__info-content">
              <h3>Connections</h3>
              <p>Solid lines = explicit relations. Dashed = computed similarity.</p>
            </div>
          </div>
        </div>

        <div className="relationship-page__graph-container">
          <RelationshipGraph height={Math.max(500, window.innerHeight - 350)} />
        </div>
      </main>
    </div>
  );
}
