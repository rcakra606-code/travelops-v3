import { useState, useMemo } from 'react';

export const useDataTable = (data, defaultSort = { key: '', direction: 'desc' }, itemsPerPage = 10) => {
  const [sortConfig, setSortConfig] = useState(defaultSort);
  const [filters, setFilters] = useState({});
  const [globalSearch, setGlobalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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
    if (globalSearch) {
      const lowerSearch = globalSearch.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(lowerSearch)
        )
      );
    }

    // Column Filters
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        result = result.filter(item => 
          String(item[key] || '').toLowerCase().includes(filters[key].toLowerCase())
        );
      }
    });

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        // Handle nested values (e.g., in Cashout/Tour financials) if specifically passed as raw data mapping
        // It's recommended to map nested data to flat data before passing to this hook if sorting by it

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
  }, [data, sortConfig, filters, globalSearch]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  return {
    sortConfig,
    filters,
    currentPage,
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
