import '../index.css';

const SkeletonLoader = ({ type }) => {
  if (type === 'hero') {
    return (
      <div
        className="card bento-col-12"
        style={{
          minHeight: '210px',
          borderRadius: '22px',
          overflow: 'hidden',
          position: 'relative',
          padding: '2.25rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '0.85rem'
        }}
      >
        <div className="shimmer-skeleton" style={{ width: '160px', height: '14px', borderRadius: '6px' }} />
        <div className="shimmer-skeleton" style={{ width: '55%', maxWidth: '420px', height: '34px', borderRadius: '8px' }} />
        <div className="shimmer-skeleton" style={{ width: '75%', maxWidth: '560px', height: '18px', borderRadius: '6px' }} />
      </div>
    );
  }

  if (type === 'stat') {
    return (
      <div
        className="card bento-col-3"
        style={{
          height: '132px',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <div className="shimmer-skeleton" style={{ width: '60%', height: '20px', borderRadius: '6px', marginBottom: '16px' }} />
        <div className="shimmer-skeleton" style={{ width: '45%', height: '30px', borderRadius: '6px' }} />
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="card bento-col-12" style={{ height: '360px', overflow: 'hidden', position: 'relative', padding: '2rem' }}>
        <div className="shimmer-skeleton" style={{ width: '220px', height: '28px', borderRadius: '6px', marginBottom: '1.75rem' }} />
        <div className="shimmer-skeleton" style={{ width: '100%', height: '220px', borderRadius: '12px' }} />
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div
        className="card"
        style={{
          padding: 0,
          overflow: 'hidden',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)'
        }}
        aria-busy="true"
        aria-label="Memuat data tabel..."
      >
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div className="shimmer-skeleton" style={{ width: '240px', height: '32px', borderRadius: '8px' }} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="shimmer-skeleton" style={{ width: '90px', height: '32px', borderRadius: '8px' }} />
            <div className="shimmer-skeleton" style={{ width: '90px', height: '32px', borderRadius: '8px' }} />
          </div>
        </div>
        <div style={{ padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1.2fr 1.6fr 1fr 1fr 0.9fr 90px',
                gap: '0.85rem',
                alignItems: 'center',
                paddingBottom: '0.75rem',
                borderBottom: row < 6 ? '1px solid var(--border)' : 'none'
              }}
            >
              <div className="shimmer-skeleton" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
              <div className="shimmer-skeleton" style={{ width: '85%', height: '18px', borderRadius: '6px' }} />
              <div className="shimmer-skeleton" style={{ width: '92%', height: '18px', borderRadius: '6px' }} />
              <div className="shimmer-skeleton" style={{ width: '75%', height: '18px', borderRadius: '6px' }} />
              <div className="shimmer-skeleton" style={{ width: '80%', height: '22px', borderRadius: '9999px' }} />
              <div className="shimmer-skeleton" style={{ width: '70%', height: '18px', borderRadius: '6px' }} />
              <div className="shimmer-skeleton" style={{ width: '64px', height: '24px', borderRadius: '6px', marginLeft: 'auto' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}
        aria-busy="true"
      >
        {[1, 2, 3, 4].map((idx) => (
          <div key={idx} className="card" style={{ padding: '1.2rem' }}>
            <div className="shimmer-skeleton" style={{ width: '48%', height: '13px', borderRadius: '5px', marginBottom: '0.75rem' }} />
            <div className="shimmer-skeleton" style={{ width: '68%', height: '28px', borderRadius: '7px', marginBottom: '0.5rem' }} />
            <div className="shimmer-skeleton" style={{ width: '80%', height: '12px', borderRadius: '5px' }} />
          </div>
        ))}
      </div>
    );
  }

  // Default table row skeleton
  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
      <div className="shimmer-skeleton" style={{ width: '20%', height: '24px', borderRadius: '4px' }} />
      <div className="shimmer-skeleton" style={{ width: '30%', height: '24px', borderRadius: '4px' }} />
      <div className="shimmer-skeleton" style={{ width: '25%', height: '24px', borderRadius: '4px' }} />
      <div className="shimmer-skeleton" style={{ width: '25%', height: '24px', borderRadius: '4px' }} />
    </div>
  );
};

export default SkeletonLoader;
