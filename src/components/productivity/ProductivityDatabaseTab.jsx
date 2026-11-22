import {
  Search, X, Trash2, UploadCloud, Eye, Copy, Edit2, ChevronUp, ChevronDown
} from 'lucide-react';
import CsvImportUtility from '../CsvImportUtility';
import ExportMenu from '../ExportMenu';
import Pagination from '../Pagination';
import BiChartCard from '../bi/BiChartCard';
import { formatIdr, formatPercent } from '../../utils/formatters';

const IMPORT_TEMPLATE_HEADERS = [
  'Period',
  'Consultant',
  'Product Category',
  'Sales Type',
  'Sales Amount (IDR)',
  'Profit Amount (IDR)',
  'Remarks'
];

const DATABASE_EXPORT_COLUMNS = [
  { header: 'Record ID', key: 'id' },
  { header: 'Period', key: 'date' },
  { header: 'Consultant', key: 'staff' },
  { header: 'Category', key: 'category' },
  { header: 'Segment', key: 'type' },
  { header: 'Sales Amount', key: 'salesAmount', format: 'currency' },
  { header: 'Profit Amount', key: 'profitAmount', format: 'currency' },
  { header: 'Margin %', key: 'marginPct', format: 'percent' },
  { header: 'Remarks', key: 'remarks' }
];

const getMarginBadgeStyle = (pct) => {
  const val = Number(pct) || 0;
  if (val >= 12) return { color: 'var(--success)', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.28)' };
  if (val >= 7) return { color: 'var(--primary)', background: 'var(--primary-soft)', border: '1px solid var(--border-glow)' };
  if (val >= 4) return { color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.28)' };
  return { color: 'var(--danger)', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.28)' };
};

const getSegmentBadgeStyle = (type) => {
  if (type === 'Corporate') {
    return { background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid var(--border-glow)' };
  }
  return { background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.28)' };
};

const ProductivityDatabaseTab = ({
  loading,
  canAdd,
  canDelete,
  canEditRecord,
  showImporter,
  onToggleImporter,
  onSpreadsheetImport,
  categories,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  filteredData,
  tableState,
  itemsPerPage,
  onItemsPerPageChange,
  selectedIds,
  allVisibleSelected,
  onToggleSelectAllPage,
  onToggleSelectRow,
  onRequestBulkDelete,
  onRequestSingleDelete,
  onOpenRecordDrawer,
  onDuplicateRecord,
  onEditRecord
}) => {
  const {
    sortConfig,
    currentPage,
    globalSearch,
    handleSort,
    handleGlobalSearch,
    setCurrentPage,
    totalPages,
    paginatedData,
    totalItems
  } = tableState;

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronDown size={12} style={{ opacity: 0.35 }} aria-hidden="true" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUp size={12} color="var(--primary)" aria-hidden="true" />
      : <ChevronDown size={12} color="var(--primary)" aria-hidden="true" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {showImporter && canAdd && (
        <CsvImportUtility
          onImport={onSpreadsheetImport}
          templateHeaders={IMPORT_TEMPLATE_HEADERS}
        />
      )}

      <BiChartCard
        title={`Database Produktivitas (${totalItems})`}
        subtitle="Klik baris transaksi untuk melihat rincian di drawer atau kelola entri."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {canDelete && selectedIds.length > 0 && (
              <button
                type="button"
                onClick={onRequestBulkDelete}
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: 'var(--danger)',
                  borderRadius: '7px',
                  padding: '0.35rem 0.65rem',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.32rem'
                }}
              >
                <Trash2 size={13} aria-hidden="true" /> Hapus ({selectedIds.length})
              </button>
            )}

            <select
              aria-label="Baris per halaman"
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                borderRadius: '7px',
                padding: '0.36rem 0.55rem',
                fontSize: '0.76rem'
              }}
            >
              <option value={10}>10 / hal</option>
              <option value={25}>25 / hal</option>
              <option value={50}>50 / hal</option>
            </select>

            {canAdd && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onToggleImporter}
                aria-expanded={showImporter}
                style={{
                  fontSize: '0.76rem',
                  padding: '0.36rem 0.65rem',
                  borderRadius: '7px',
                  borderColor: showImporter ? 'var(--primary)' : undefined,
                  color: showImporter ? 'var(--primary)' : undefined
                }}
              >
                <UploadCloud size={14} aria-hidden="true" /> Import
              </button>
            )}

            <ExportMenu
              data={filteredData}
              columns={DATABASE_EXPORT_COLUMNS}
              filename="Productivity_Database"
            />
          </div>
        }
      >
        {/* Search + Category Filter Strip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '0.75rem' }}>
          <div style={{ position: 'relative', maxWidth: '380px' }}>
            <Search
              size={14}
              aria-hidden="true"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
            />
            <input
              type="text"
              aria-label="Cari konsultan, kategori, periode, atau catatan"
              placeholder="Cari konsultan, kategori, periode, catatan..."
              value={globalSearch}
              onChange={(e) => handleGlobalSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.42rem 1.8rem 0.42rem 2rem',
                borderRadius: '7px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontSize: '0.79rem'
              }}
            />
            {globalSearch && (
              <button
                type="button"
                aria-label="Bersihkan pencarian"
                onClick={() => handleGlobalSearch('')}
                style={{
                  position: 'absolute',
                  right: '7px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div role="group" aria-label="Filter cepat kategori produk" style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {['All', ...categories].map((cat) => {
              const active = selectedCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectCategoryFilter(cat)}
                  style={{
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    background: active ? 'var(--primary-soft)' : 'var(--bg-surface)',
                    color: active ? 'var(--primary)' : 'var(--text-muted)',
                    borderRadius: '6px',
                    padding: '0.22rem 0.58rem',
                    fontSize: '0.73rem',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="bi-table" style={{ minWidth: '940px' }}>
            <thead>
              <tr>
                {canDelete && (
                  <th style={{ width: '36px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      aria-label="Pilih semua baris pada halaman ini"
                      checked={allVisibleSelected}
                      onChange={onToggleSelectAllPage}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                )}
                <th onClick={() => handleSort('yearMonth')} style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>Periode {renderSortIcon('yearMonth')}</span>
                </th>
                <th onClick={() => handleSort('staff')} style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>Konsultan {renderSortIcon('staff')}</span>
                </th>
                <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>Kategori {renderSortIcon('category')}</span>
                </th>
                <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>Segmen {renderSortIcon('type')}</span>
                </th>
                <th onClick={() => handleSort('salesAmount')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>Sales {renderSortIcon('salesAmount')}</span>
                </th>
                <th onClick={() => handleSort('profitAmount')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>Profit {renderSortIcon('profitAmount')}</span>
                </th>
                <th onClick={() => handleSort('marginPct')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>Margin {renderSortIcon('marginPct')}</span>
                </th>
                <th>Catatan</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((rec) => {
                const isChecked = selectedIds.includes(rec.id);
                const editable = canEditRecord(rec);
                return (
                  <tr
                    key={rec.id}
                    onClick={() => onOpenRecordDrawer(rec)}
                    style={{
                      cursor: 'pointer',
                      background: isChecked ? 'var(--primary-soft)' : undefined
                    }}
                  >
                    {canDelete && (
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Pilih entri ${rec.category} ${rec.staff}`}
                          checked={isChecked}
                          onChange={() => onToggleSelectRow(rec.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    )}
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{rec.periodLabel}</div>
                      <div className="tabular-nums" style={{ fontSize: '0.69rem', color: 'var(--text-subtle)' }}>{rec.date}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{rec.staff}</td>
                    <td>
                      <span className="bi-micro-badge">{rec.category}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          ...getSegmentBadgeStyle(rec.type),
                          padding: '0.12rem 0.48rem',
                          borderRadius: '5px',
                          fontSize: '0.7rem',
                          fontWeight: 700
                        }}
                      >
                        {rec.type}
                      </span>
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 700 }}>
                      {formatIdr(rec.salesAmount)}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 700 }}>
                      {formatIdr(rec.profitAmount)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        className="tabular-nums"
                        style={{
                          ...getMarginBadgeStyle(rec.marginPct),
                          padding: '0.12rem 0.45rem',
                          borderRadius: '5px',
                          fontSize: '0.7rem',
                          fontWeight: 700
                        }}
                      >
                        {formatPercent(rec.marginPct, 2)}
                      </span>
                    </td>
                    <td
                      style={{ maxWidth: '185px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: rec.remarks ? 'var(--text-main)' : 'var(--text-subtle)' }}
                      title={rec.remarks || ''}
                    >
                      {rec.remarks || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                        <button
                          type="button"
                          title="Lihat Detail"
                          aria-label={`Lihat detail ${rec.category} ${rec.staff}`}
                          onClick={() => onOpenRecordDrawer(rec)}
                          style={{ padding: '0.34rem', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex' }}
                        >
                          <Eye size={13} />
                        </button>
                        {canAdd && (
                          <button
                            type="button"
                            title="Duplikasi Entri"
                            aria-label={`Duplikasi entri ${rec.category} ${rec.staff}`}
                            onClick={() => onDuplicateRecord(rec)}
                            style={{ padding: '0.34rem', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--primary)', cursor: 'pointer', display: 'flex' }}
                          >
                            <Copy size={13} />
                          </button>
                        )}
                        {editable && (
                          <button
                            type="button"
                            title="Edit Entri"
                            aria-label={`Edit entri ${rec.category} ${rec.staff}`}
                            onClick={() => onEditRecord(rec)}
                            style={{ padding: '0.34rem', borderRadius: '6px', background: 'var(--primary-soft)', border: '1px solid var(--border)', color: 'var(--primary)', cursor: 'pointer', display: 'flex' }}
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            title="Hapus Entri"
                            aria-label={`Hapus entri ${rec.category} ${rec.staff}`}
                            onClick={() => onRequestSingleDelete(rec)}
                            style={{ padding: '0.34rem', borderRadius: '6px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.25)', color: 'var(--danger)', cursor: 'pointer', display: 'flex' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={canDelete ? 10 : 9} style={{ textAlign: 'center', padding: '2.2rem 1rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Memuat data produktivitas...' : 'Tidak ada entri yang cocok dengan filter aktif.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </BiChartCard>
    </div>
  );
};

export default ProductivityDatabaseTab;
