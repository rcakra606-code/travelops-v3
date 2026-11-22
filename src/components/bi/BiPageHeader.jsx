/**
 * Restrained Enterprise BI Page Header
 * Avoids oversized gradient banners and wasted vertical dashboard real estate.
 */
const BiPageHeader = ({
  eyebrow,
  title,
  subtitle,
  metaBadge,
  actions
}) => {
  return (
    <header
      className="bi-page-header"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        paddingBottom: '1rem',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--border)'
      }}
    >
      <div style={{ minWidth: 0, flex: '1 1 320px' }}>
        {(eyebrow || metaBadge) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
            {eyebrow && (
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--primary)'
                }}
              >
                {eyebrow}
              </span>
            )}
            {metaBadge}
          </div>
        )}
        <h1
          style={{
            margin: 0,
            fontSize: '1.4rem',
            fontWeight: 800,
            lineHeight: 1.25,
            letterSpacing: '-0.025em',
            color: 'var(--text-main)'
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              margin: '0.28rem 0 0 0',
              fontSize: '0.84rem',
              lineHeight: 1.45,
              color: 'var(--text-muted)',
              maxWidth: '720px'
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            flexShrink: 0
          }}
        >
          {actions}
        </div>
      )}
    </header>
  );
};

export default BiPageHeader;
