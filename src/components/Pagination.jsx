import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (totalPages <= 1 && totalItems === 0) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', borderBottomLeftRadius: '1rem', borderBottomRightRadius: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Showing {totalItems > 0 ? startItem : 0} to {endItem} of {totalItems} entries
      </div>
      
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <button 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
          style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)', padding: '0.5rem', borderRadius: '0.25rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={16} />
        </button>
        
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' ? onPageChange(page) : null}
            disabled={page === '...'}
            style={{ 
              background: page === currentPage ? 'var(--primary)' : 'var(--bg-dark)', 
              border: '1px solid var(--border)', 
              color: page === currentPage ? '#fff' : 'var(--text-main)', 
              padding: '0.5rem 0.75rem', 
              borderRadius: '0.25rem', 
              cursor: page === '...' ? 'default' : 'pointer',
              fontWeight: page === currentPage ? 'bold' : 'normal'
            }}
          >
            {page}
          </button>
        ))}
        
        <button 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages || totalPages === 0}
          style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', color: currentPage === totalPages || totalPages === 0 ? 'var(--text-muted)' : 'var(--text-main)', padding: '0.5rem', borderRadius: '0.25rem', cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
