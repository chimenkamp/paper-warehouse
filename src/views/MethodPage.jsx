import { useParams, Link } from 'react-router-dom';
import { Header, MethodDetail } from '@/components';
import { useAppState, getMethodById, getPipelineStepById, getSiteConfig, resolveStepField } from '@/lib';
import '@/styles/detail.css';

/**
 * Entry detail page view
 */
export default function MethodPage() {
  const { methodId } = useParams();
  const { loading, error, data } = useAppState();

  if (loading) {
    return (
      <div className="main-layout">
        <Header />
        <main className="main-content">
          <div className="loading">
            <div className="loading__spinner" />
            <p>Loading...</p>
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

  const config = getSiteConfig();
  const stepFieldName = resolveStepField(config);
  const method = getMethodById(data, methodId);
  const step = method ? getPipelineStepById(data, method[stepFieldName]) : null;

  return (
    <div className="main-layout">
      <Header />
      <main className="method-page">
        <Link to="/" className="method-page__back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Explorer
        </Link>

        {method && (
          <header className="method-page__header">
            <span className="method-detail__step">
              {step?.name || method[stepFieldName]?.replace(/_/g, ' ') || ''}
            </span>
            <h1 className="method-page__title">{method.name}</h1>
            <div className="method-page__meta">
              {method.references?.year && <span>{method.references.year}</span>}
              {method.references?.venue && (
                <>
                  <span className="method-page__meta-dot" />
                  <span>{method.references.venue}</span>
                </>
              )}
              {method.maturity && (
                <>
                  <span className="method-page__meta-dot" />
                  <span>{method.maturity}</span>
                </>
              )}
            </div>
          </header>
        )}

        <MethodDetail methodId={methodId} />
      </main>
    </div>
  );
}
