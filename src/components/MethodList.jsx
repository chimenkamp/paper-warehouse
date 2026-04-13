import { useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch, actions, getSiteConfig, resolveStepField } from '@/lib';

/**
 * Format paper URL correctly.
 */
function formatPaperUrl(doiOrUrl) {
  if (!doiOrUrl) return null;
  if (doiOrUrl.startsWith('http://') || doiOrUrl.startsWith('https://')) return doiOrUrl;
  if (doiOrUrl.startsWith('10.')) return `https://doi.org/${doiOrUrl}`;
  return `https://doi.org/${doiOrUrl}`;
}

/**
 * Format step name for display using config step definitions.
 */
function formatStepName(stepId) {
  const config = getSiteConfig();
  const step = (config?.visualization?.steps || []).find((s) => s.id === stepId);
  if (step) return step.name;
  return stepId?.replace(/_/g, ' ') || '';
}

/**
 * Single entry item — catalog row style.
 */
function MethodItem({ method }) {
  const navigate = useNavigate();
  const { isCompareMode, compareMethodIds } = useAppState();
  const dispatch = useAppDispatch();
  const config = getSiteConfig();
  const stepFieldName = resolveStepField(config);

  const isSelected = compareMethodIds.includes(method.id);

  const handleClick = () => {
    if (isCompareMode) {
      dispatch(actions.toggleCompareMethod(method.id));
    } else {
      navigate(`/methods/${method.id}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <article
      className={`method-item ${isSelected ? 'method-item--selected' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${method.name}. Click to ${isCompareMode ? 'add to comparison' : 'view details'}`}
    >
      {isCompareMode && (
        <div className={`method-item__checkbox ${isSelected ? 'method-item__checkbox--checked' : ''}`}>
          {isSelected && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}

      <div className="method-item__main">
        <h3 className="method-item__name">{method.name}</h3>
        {method.short_description && (
          <p className="method-item__description">{method.short_description}</p>
        )}

        <div className="method-item__meta">
          {method[stepFieldName] && (
            <span className="method-item__step">{formatStepName(method[stepFieldName])}</span>
          )}
          {method.references?.year && (
            <>
              <span className="method-item__dot" />
              <span className="method-item__year">{method.references.year}</span>
            </>
          )}
          {method.references?.venue && (
            <>
              <span className="method-item__dot" />
              <span className="method-item__year">{method.references.venue}</span>
            </>
          )}
        </div>

        {method.modalities && method.modalities.length > 0 && (
          <div className="method-item__tags">
            {method.modalities.map((mod) => (
              <span key={mod} className={`tag tag--${mod}`}>{mod}</span>
            ))}
            {method.maturity && <span className="tag">{method.maturity}</span>}
          </div>
        )}
      </div>

      <div className="method-item__actions">
        {method.references?.doi_or_url && (
          <a
            className="btn btn--ghost btn--sm"
            href={formatPaperUrl(method.references.doi_or_url)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open paper"
          >
            📄
          </a>
        )}
        {method.artifacts?.code_url && (
          <a
            className="btn btn--ghost btn--sm"
            href={method.artifacts.code_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open code repository"
          >
            💻
          </a>
        )}
        {method.artifacts?.dataset_url && (
          <a
            className="btn btn--ghost btn--sm"
            href={method.artifacts.dataset_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open dataset"
          >
            📊
          </a>
        )}
        <button
          className="btn btn--ghost btn--sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/methods/${method.id}`);
          }}
          title="View details"
        >
          →
        </button>
      </div>
    </article>
  );
}

/**
 * Entry list component with filtering results.
 */
export default function MethodList() {
  const { filteredMethods, filters, loading } = useAppState();

  if (loading) {
    return (
      <div className="loading">
        <div className="loading__spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (filteredMethods.length === 0) {
    const hasFilters = Object.values(filters).some((v) =>
      Array.isArray(v) ? v.length > 0 : !!v
    );

    return (
      <div className="empty-state">
        <div className="empty-state__icon">🔍</div>
        <h3 className="empty-state__title">No entries found</h3>
        <p className="empty-state__text">
          {hasFilters
            ? 'Try adjusting your filters or search query.'
            : 'No entries have been added yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="method-list">
      {filteredMethods.map((method) => (
        <MethodItem key={method.id} method={method} />
      ))}
    </div>
  );
}
