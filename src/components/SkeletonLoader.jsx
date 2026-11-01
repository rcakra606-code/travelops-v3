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
