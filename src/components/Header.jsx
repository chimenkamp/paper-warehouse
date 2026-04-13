import { Link, useLocation } from 'react-router-dom';
import { useAppState, useAppDispatch, actions, getSiteConfig, isFeatureEnabled } from '@/lib';
import '@/styles/header.css';

/**
 * Search input
 */
function SearchBox() {
  const { filters } = useAppState();
  const dispatch = useAppDispatch();
  const config = getSiteConfig();
  const labels = config?.visualization?.labels || {};

  const handleChange = (e) => {
    dispatch(actions.setFilters({ searchQuery: e.target.value }));
  };

  const handleClear = () => {
    dispatch(actions.setFilters({ searchQuery: '' }));
  };

  return (
    <div className="search-box">
      <svg
        className="search-box__icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        className="search-box__input"
        placeholder={`Search ${labels.entryPlural || 'entries'}...`}
        value={filters.searchQuery || ''}
        onChange={handleChange}
        aria-label={`Search ${labels.entryPlural || 'entries'}`}
      />
      {filters.searchQuery && (
        <button
          className="search-box__clear"
          onClick={handleClear}
          aria-label="Clear search"
          type="button"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Header component — reads title, subtitle, logo, and navigation from config.
 */
export default function Header() {
  const location = useLocation();
  const config = getSiteConfig();
  const siteConfig = config?.site || {};
  const navItems = (config?.navigation || []).filter((n) => n.enabled !== false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="header__brand">
          <div className="header__logo">{siteConfig.logoText || 'PE'}</div>
          <div>
            <div className="header__title">{siteConfig.title || 'Paper Warehouse'}</div>
            {siteConfig.subtitle && (
              <div className="header__subtitle">{siteConfig.subtitle}</div>
            )}
          </div>
        </Link>

        {isFeatureEnabled(config, 'search') && (
          <div className="header__search">
            <SearchBox />
          </div>
        )}

        <nav className="header__nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`header__nav-link ${isActive(item.path) ? 'header__nav-link--active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
