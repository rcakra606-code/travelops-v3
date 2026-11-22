import { useState, useMemo, useDeferredValue } from 'react';

export const useDataTable = (data, defaultSort = { key: '', direction: 'desc' }, itemsPerPage = 10) => {
  const [sortConfig, setSortConfig] = useState(defaultSort);
  const [filters, setFilters] = useState({});
  const [globalSearch, setGlobalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Defer expensive full-table filtering while user types rapidly
  const deferredSearch = useDeferredValue(globalSearch);
  const deferredFilters = useDeferredValue(filters);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleGlobalSearch = (value) => {
    setGlobalSearch(value);
    setCurrentPage(1);
  };

  const processedData = useMemo(() => {
    if (!data) return [];
    let result = [...data];

    // Global Search
    if (deferredSearch) {
      const lowerSearch = deferredSearch.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(lowerSearch)
        )
      );
    }

    // Column Filters
    Object.keys(deferredFilters).forEach(key => {
      if (deferredFilters[key]) {
        const lowerFilter = deferredFilters[key].toLowerCase();
        result = result.filter(item => 
          String(item[key] || '').toLowerCase().includes(lowerFilter)
        );
      }
    });

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';

        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, sortConfig, deferredFilters, deferredSearch]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const activePage = totalPages > 0 ? Math.min(Math.max(1, currentPage), totalPages) : 1;

  const paginatedData = useMemo(() => {
    const start = (activePage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, activePage, itemsPerPage]);

  return {
    sortConfig,
    filters,
    currentPage: activePage,
    globalSearch,
    itemsPerPage,
    handleSort,
    handleFilterChange,
    handleGlobalSearch,
    setCurrentPage,
    totalPages,
    paginatedData,
    totalItems: processedData.length
  };
};
