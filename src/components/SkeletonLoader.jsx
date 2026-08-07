import React from 'react';
import '../index.css'; // For the shimmer animation

const SkeletonLoader = ({ type }) => {
  if (type === 'stat') {
    return (
      <div className="card bento-col-3" style={{ height: '120px', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="shimmer-skeleton" style={{ width: '60%', height: '24px', borderRadius: '4px', marginBottom: '16px' }}></div>
        <div className="shimmer-skeleton" style={{ width: '40%', height: '32px', borderRadius: '4px' }}></div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="card bento-col-12" style={{ height: '350px', overflow: 'hidden', position: 'relative', padding: '2rem' }}>
        <div className="shimmer-skeleton" style={{ width: '200px', height: '32px', borderRadius: '4px', marginBottom: '2rem' }}></div>
        <div className="shimmer-skeleton" style={{ width: '100%', height: '200px', borderRadius: '12px' }}></div>
      </div>
    );
  }

  // Default table row skeleton
  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
      <div className="shimmer-skeleton" style={{ width: '20%', height: '24px', borderRadius: '4px' }}></div>
      <div className="shimmer-skeleton" style={{ width: '30%', height: '24px', borderRadius: '4px' }}></div>
      <div className="shimmer-skeleton" style={{ width: '25%', height: '24px', borderRadius: '4px' }}></div>
      <div className="shimmer-skeleton" style={{ width: '25%', height: '24px', borderRadius: '4px' }}></div>
    </div>
  );
};

export default SkeletonLoader;
