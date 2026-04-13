import { Header, ThemeToggle } from '@/components';
import { useAppState, getSiteConfig, isFeatureEnabled, getStepColorMap } from '@/lib';
import '@/styles/about.css';

/**
 * About page — reads content from site.config.json.
 */
export default function AboutPage() {
  const { data } = useAppState();
  const config = getSiteConfig();
  const aboutConfig = config?.about || {};
  const pipelineSteps = config?.visualization?.steps || data?.pipeline_steps || [];
  const stepColors = getStepColorMap(config);
  const metadata = data?.metadata;

  return (
    <div className="main-layout">
      <Header />
      <main className="about-page">
        <article>
          <h1 className="t-page-title" style={{ marginBottom: 'var(--sp-8)' }}>
            {aboutConfig.title || 'About'}
          </h1>

          {aboutConfig.introduction && (
            <section className="about-section">
              <p className="about-intro">{aboutConfig.introduction}</p>
            </section>
          )}

          {(aboutConfig.sections || []).map((section, idx) => (
            <section className="about-section" key={idx}>
              <h2 className="t-section-title" style={{ marginBottom: 'var(--sp-4)' }}>
                {section.title}
              </h2>
              {section.content && (
                <p className="t-body" style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-5)' }}>
                  {section.content}
                </p>
              )}

              {section.showSteps && pipelineSteps.length > 0 && (
                <div className="pipeline-steps">
                  {pipelineSteps.map((step) => (
                    <div
                      key={step.id}
                      className="pipeline-step-card"
                      style={{ '--step-color': stepColors[step.id] || step.color || 'var(--accent)' }}
                    >
                      <div className="pipeline-step-card__header">
                        <span className="pipeline-step-card__number">{step.order}</span>
                        <h3 className="pipeline-step-card__title">{step.name}</h3>
                      </div>
                      <p className="pipeline-step-card__desc">{step.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}

          {/* Settings */}
          {isFeatureEnabled(config, 'themeToggle') && (
            <section className="about-section">
              <h2 className="t-section-title" style={{ marginBottom: 'var(--sp-4)' }}>
                Settings
              </h2>
              <div className="settings-row">
                <div className="settings-row__info">
                  <span className="settings-row__label">Appearance</span>
                  <span className="settings-row__desc">Switch between dark and light color schemes</span>
                </div>
                <ThemeToggle />
              </div>
            </section>
          )}

          {metadata && (
            <section className="about-section about-metadata">
              <div className="metadata-item">
                <span className="t-caption">Version</span>
                <span className="t-body">{metadata.version}</span>
              </div>
              {metadata.lastUpdated && (
                <div className="metadata-item">
                  <span className="t-caption">Last Updated</span>
                  <span className="t-body">{metadata.lastUpdated}</span>
                </div>
              )}
              <div className="metadata-item">
                <span className="t-caption">Total Entries</span>
                <span className="t-body">{data?.methods?.length || 0}</span>
              </div>
            </section>
          )}
        </article>
      </main>
    </div>
  );
}
