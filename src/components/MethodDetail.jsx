import { useNavigate } from 'react-router-dom';
import { useAppState, getMethodById, getRelatedMethods, getPipelineStepById, getSiteConfig, getDetailFields, resolveStepField } from '@/lib';
import '@/styles/detail.css';

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
 * Renders a single field section based on its type from config.
 */
function FieldSection({ field, value }) {
  if (value === undefined || value === null) return null;

  switch (field.type) {
    case 'text':
    case 'longtext':
      if (!value) return null;
      return (
        <section className="method-detail__section">
          <h2 className="method-detail__section-title">{field.label}</h2>
          <p className="method-detail__section-content">{value}</p>
        </section>
      );

    case 'list':
      if (!Array.isArray(value) || value.length === 0) return null;
      return (
        <section className="method-detail__section">
          <h2 className="method-detail__section-title">{field.label}</h2>
          <ul className="method-detail__list">
            {value.map((item, i) => (
              <li key={i} className="method-detail__list-item">{item}</li>
            ))}
          </ul>
        </section>
      );

    case 'tags':
      if (!Array.isArray(value) || value.length === 0) return null;
      return (
        <section className="method-detail__section">
          <h2 className="method-detail__section-title">{field.label}</h2>
          <div className="method-detail__tags">
            {value.map((tag) => (
              <span key={tag} className={`tag tag--${tag}`}>{tag}</span>
            ))}
          </div>
        </section>
      );

    case 'enum':
      if (!value) return null;
      return (
        <section className="method-detail__section">
          <h2 className="method-detail__section-title">{field.label}</h2>
          <span className="tag">{value}</span>
        </section>
      );

    case 'reference':
      if (!value || typeof value !== 'object') return null;
      return (
        <section className="method-detail__section">
          <h2 className="method-detail__section-title">{field.label}</h2>
          <div className="method-detail__reference">
            {value.paper_title && (
              <p className="method-detail__reference-title">{value.paper_title}</p>
            )}
            {value.authors && (
              <p className="method-detail__reference-authors">
                {Array.isArray(value.authors) ? value.authors.join(', ') : value.authors}
              </p>
            )}
            <p className="method-detail__reference-meta">
              {[value.venue, value.year].filter(Boolean).join(', ')}
            </p>
            {value.doi_or_url && (
              <a
                href={formatPaperUrl(value.doi_or_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--sm btn--secondary"
                style={{ marginTop: 'var(--sp-3)' }}
              >
                View Paper →
              </a>
            )}
          </div>
        </section>
      );

    case 'links': {
      if (!value || typeof value !== 'object') return null;
      const linkEntries = Object.entries(value).filter(([, url]) => url);
      if (linkEntries.length === 0) return null;
      return (
        <section className="method-detail__section">
          <h2 className="method-detail__section-title">{field.label}</h2>
          <div className="method-detail__artifacts">
            {linkEntries.map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--sm btn--secondary"
              >
                {key.replace(/_/g, ' ').replace(/url$/i, '').trim()} →
              </a>
            ))}
          </div>
        </section>
      );
    }

    default:
      // Fallback: render as text if it's a string, or JSON if object
      if (typeof value === 'string') {
        return (
          <section className="method-detail__section">
            <h2 className="method-detail__section-title">{field.label}</h2>
            <p className="method-detail__section-content">{value}</p>
          </section>
        );
      }
      return null;
  }
}

/**
 * Config-driven detail panel.
 * Renders all fields marked showInDetail in site.config.json, in declared order.
 */
export default function MethodDetail({ methodId, onClose }) {
  const navigate = useNavigate();
  const { data } = useAppState();

  if (!data) return null;

  const config = getSiteConfig();
  const detailFields = getDetailFields(config);
  const stepFieldName = resolveStepField(config);

  const method = getMethodById(data, methodId);

  if (!method) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">❌</div>
        <h3 className="empty-state__title">Entry not found</h3>
        <p className="empty-state__text">The entry &ldquo;{methodId}&rdquo; could not be found.</p>
        <button className="btn btn--primary" onClick={() => navigate('/')}>
          Back to Explorer
        </button>
      </div>
    );
  }

  const step = getPipelineStepById(data, method[stepFieldName]);
  const relatedMethods = getRelatedMethods(data, methodId);

  const handleClose = () => {
    if (onClose) onClose();
    else navigate('/');
  };

  const handleRelatedClick = (relatedId) => {
    navigate(`/methods/${relatedId}`);
  };

  // Separate special fields from generic ones
  const skipKeys = new Set(['id', 'step', 'name', 'related_method_ids']);
  const genericFields = detailFields.filter(
    (f) => !skipKeys.has(f.key) && f.type !== 'relations'
  );

  return (
    <>
      {onClose && <div className="method-detail__backdrop" onClick={handleClose} onKeyDown={(e) => { if (e.key === 'Escape') handleClose(); }} role="presentation" />}
      <div className="method-detail" role="dialog" aria-labelledby="method-title">
        <div className="method-detail__header">
          <div>
            <span className="method-detail__step">
              {step?.name || method[stepFieldName]?.replace(/_/g, ' ') || ''}
            </span>
            <h1 id="method-title" className="method-detail__title">
              {method.name}
            </h1>
          </div>
          <button
            className="method-detail__close"
            onClick={handleClose}
            aria-label="Close detail panel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="method-detail__content">
          {/* Render each configured detail field */}
          {genericFields.map((field) => (
            <FieldSection key={field.key} field={field} value={method[field.key]} />
          ))}

          {/* Related entries */}
          {relatedMethods.length > 0 && (
            <section className="method-detail__section">
              <h2 className="method-detail__section-title">Related Entries</h2>
              <div className="related-methods">
                {relatedMethods.map((related) => (
                  <div
                    key={related.id}
                    className="related-method"
                    onClick={() => handleRelatedClick(related.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRelatedClick(related.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${related.name}`}
                  >
                    <span className="related-method__name">{related.name}</span>
                    <span className="related-method__relationship">{related.relationship}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Metadata timestamps */}
          {(method.created_at || method.updated_at) && (
            <section className="method-detail__section" style={{ marginTop: 'var(--sp-8)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                {method.created_at && `Created: ${new Date(method.created_at).toLocaleDateString()}`}
                {method.created_at && method.updated_at && ' · '}
                {method.updated_at && `Updated: ${new Date(method.updated_at).toLocaleDateString()}`}
              </p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
