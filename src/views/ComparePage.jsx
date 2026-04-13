import { useSearchParams, Link } from 'react-router-dom';
import { Header, ComparisonView } from '@/components';
import { useAppState, useAppDispatch, actions } from '@/lib';

/**
 * Compare page view
 */
export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const { loading, error } = useAppState();
  const dispatch = useAppDispatch();

  const methodIds = searchParams.get('methods')?.split(',').filter(Boolean) || [];

  if (loading) {
    return (
      <div className="main-layout">
        <Header />
        <main className="main-content">
          <div className="loading">
            <div className="loading__spinner" />
            <p>Loading comparison...</p>
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

  return (
    <div className="main-layout">
      <Header />
      <main className="compare-page">
        <Link
          to="/"
          className="compare-page__back"
          onClick={() => dispatch(actions.clearCompare())}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Explorer
        </Link>

        <h1 className="t-page-title" style={{ marginBottom: 'var(--sp-6)' }}>
          Comparison
        </h1>

        {methodIds.length < 2 ? (
          <div className="compare-empty">
            <p className="t-body" style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-4)' }}>
              Select at least 2 entries to compare.
            </p>
            <Link to="/" className="btn btn--primary">
              Go to Explorer
            </Link>
          </div>
        ) : (
          <ComparisonView methodIds={methodIds} />
        )}
      </main>
    </div>
  );
}
