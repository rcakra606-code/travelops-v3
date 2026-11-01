import { useState } from 'react';
import { FileSpreadsheet, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { useTheme } from '../../../context/ThemeContext';
import { getTripDurationInfo, formatShortDate } from '../../../utils/tourHelpers';
import TourSettlementModal from '../TourSettlementModal';

const Step4Confirmation = ({ data, onBackToFinancials }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [showSettlementModal, setShowSettlementModal] = useState(false);

  const fin = data.financials || {};
  const basicPrice =
    fin.basicTourPrice !== undefined ? Number(fin.basicTourPrice) || 0 : Number(fin.totalSales) || 0;
  const discSupplier = Number(fin.discountSupplier || 0);
  const discBranch = Number(fin.discountBranch || 0);
  const profitVal = Number(fin.profit || 0);
  const totalSellingPrice =
    fin.totalSellingPrice !== undefined
      ? Number(fin.totalSellingPrice) || 0
      : Number(fin.totalOmset || basicPrice - discSupplier - discBranch);
  const totalNettPrice =
    fin.totalNettPrice !== undefined
      ? Number(fin.totalNettPrice) || 0
      : Number(fin.cost || basicPrice - discSupplier - profitVal);
  const depositAmount = Number(fin.depositAmount || 0);
  const sisaPelunasan = Math.max(0, totalSellingPrice - depositAmount);
  const hasDeposit = Boolean(fin.depositNumber && fin.depositNumber.trim() !== '');
  const durationInfo = getTripDurationInfo(data.departureDate, data.returnDate);

  const amberColor = isLight ? '#b45309' : '#fbbf24';
  const emeraldColor = isLight ? '#047857' : '#34d399';

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Step 4: Review &amp; Confirm Booking
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Double-check itinerary details, passenger pricing, and deposit receipt before saving.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSettlementModal(true)}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 1.1rem',
            fontSize: '0.84rem'
          }}
        >
          <FileSpreadsheet size={16} /> Preview Bukti Pelunasan Tour
        </button>
      </div>

      {!hasDeposit && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1.5px solid rgba(239, 68, 68, 0.4)',
            padding: '0.85rem 1.2rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            color: 'var(--danger)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: '0.86rem', fontWeight: '600' }}>
              <strong>Nomor DP Required:</strong> Enter Nomor DP in Step 3 before saving this booking.
            </span>
          </div>
          {onBackToFinancials && (
            <button
              type="button"
              onClick={onBackToFinancials}
              className="btn btn-danger"
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
            >
              Fill Nomor DP Now
            </button>
          )}
        </div>
      )}

      <div className="form-grid">
        {/* Tour Details Card */}
        <div className="card">
          <h3
            style={{
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '0.5rem',
              color: 'var(--primary)',
              fontSize: '1rem'
            }}
          >
            Tour &amp; Schedule Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.55rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Tour Code:</span>
            <span className="font-mono" style={{ fontWeight: '700', color: 'var(--primary)' }}>
              {data.tourCode || '-'}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>Booking Code:</span>
            <span className="font-mono" style={{ fontWeight: '600' }}>
              {data.bookingCode || '-'}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>Destination:</span>
            <span style={{ fontWeight: '700' }}>
              {data.country || '-'} {data.category ? `(${data.category})` : ''}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>Travel Dates:</span>
            <span style={{ fontWeight: '600' }}>
              {formatShortDate(data.departureDate)} → {formatShortDate(data.returnDate)}
              {durationInfo?.valid && (
                <span style={{ color: 'var(--primary)', marginLeft: '0.4rem', fontSize: '0.78rem' }}>
                  ({durationInfo.label})
                </span>
              )}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>PIC Staff:</span>
            <span style={{ fontWeight: '600' }}>{data.staffName || '-'}</span>

            <span style={{ color: 'var(--text-muted)' }}>Status:</span>
            <span
              style={{
                fontWeight: '700',
                color:
                  data.status === 'Confirm'
                    ? 'var(--success)'
                    : data.status === 'Cancel'
                      ? 'var(--danger)'
                      : amberColor
              }}
            >
              {data.status}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>Form Claim MDR:</span>
            <span>
              {data.claimMdr ? (
                <span style={{ color: emeraldColor, fontWeight: '700', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle2 size={13} /> Checked
                </span>
              ) : (
                <span style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>Unchecked</span>
              )}
            </span>
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="card">
          <h3
            style={{
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '0.5rem',
              color: 'var(--primary)',
              fontSize: '1rem'
            }}
          >
            Financial Summary
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: '0.55rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Harga Dasar Tour:</span>
            <span className="font-mono" style={{ fontWeight: '600' }}>
              Rp {formatCurrency(basicPrice)}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>Discount Supplier:</span>
            <span className="font-mono" style={{ fontWeight: '600', color: amberColor }}>
              - Rp {formatCurrency(discSupplier)}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>Discount Branch:</span>
            <span className="font-mono" style={{ fontWeight: '600', color: amberColor }}>
              - Rp {formatCurrency(discBranch)}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>Nominal Profit:</span>
            <span className="font-mono" style={{ fontWeight: '700', color: emeraldColor }}>
              Rp {formatCurrency(profitVal)}
            </span>

            <span style={{ color: 'var(--primary)', fontWeight: '700' }}>Total Selling (Omset):</span>
            <span className="font-mono" style={{ fontWeight: '800', color: 'var(--primary)' }}>
              Rp {formatCurrency(totalSellingPrice)}
            </span>

            <span style={{ color: emeraldColor, fontWeight: '700' }}>Total Nett (Cost):</span>
            <span className="font-mono" style={{ fontWeight: '800', color: emeraldColor }}>
              Rp {formatCurrency(totalNettPrice)}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>Nomor &amp; Nominal DP:</span>
            <span>
              {hasDeposit ? (
                <span className="font-mono" style={{ fontWeight: '700', color: emeraldColor }}>
                  {fin.depositNumber} · Rp {formatCurrency(depositAmount)}
                </span>
              ) : (
                <span style={{ color: 'var(--danger)', fontWeight: '700', fontSize: '0.8rem' }}>
                  Required before saving
                </span>
              )}
            </span>

            <span style={{ color: 'var(--primary)', fontWeight: '700' }}>Sisa Pelunasan Tamu:</span>
            <span
              className="font-mono"
              style={{
                fontWeight: '800',
                color: sisaPelunasan <= 0 && totalSellingPrice > 0 ? emeraldColor : 'var(--primary)'
              }}
            >
              Rp {formatCurrency(sisaPelunasan)}{' '}
              {sisaPelunasan <= 0 && totalSellingPrice > 0 ? '(LUNAS)' : ''}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>Invoice Number:</span>
            <span className="font-mono" style={{ fontWeight: '600' }}>
              {fin.invoiceNumber || (
                <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic', fontFamily: 'inherit' }}>
                  Not issued yet
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Passengers Manifest Table */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3
          style={{
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0.5rem',
            color: 'var(--primary)',
            fontSize: '1rem'
          }}
        >
          Traveler Manifest ({data.paxInfo?.length || 0} Pax)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ fontSize: '0.84rem' }}>
            <thead>
              <tr>
                <th>Traveler Name</th>
                <th>Contact</th>
                <th>Harga Dasar</th>
                <th>Disc. Supplier</th>
                <th>Disc. Branch</th>
                <th>Profit</th>
                <th>Selling Price</th>
                <th>Nett Price</th>
              </tr>
            </thead>
            <tbody>
              {(data.paxInfo || []).map((pax, idx) => {
                const pBasic =
                  Number(pax.basicPrice !== undefined && pax.basicPrice !== '' ? pax.basicPrice : pax.sellingPrice) || 0;
                const pDiscSupplier = Number(pax.discountSupplier) || 0;
                const pDiscBranch = Number(pax.discountBranch) || 0;
                const pProfit = Number(pax.profit) || 0;
                const pSellingPrice = pBasic - pDiscSupplier - pDiscBranch;
                const pNettPrice = pBasic - pDiscSupplier - pProfit;
                const fullName = `${pax.firstName || ''} ${pax.lastName || ''}`.trim();

                return (
                  <tr key={pax.id || idx}>
                    <td style={{ fontWeight: '600' }}>
                      {fullName ? `${pax.title}. ${fullName}` : `Passenger ${idx + 1}`}
                    </td>
                    <td>
                      <div>{pax.email || '-'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                        {pax.phone || '-'}
                      </div>
                    </td>
                    <td className="font-mono">Rp {formatCurrency(pBasic)}</td>
                    <td className="font-mono" style={{ color: amberColor }}>
                      - Rp {formatCurrency(pDiscSupplier)}
                    </td>
                    <td className="font-mono" style={{ color: amberColor }}>
                      - Rp {formatCurrency(pDiscBranch)}
                    </td>
                    <td className="font-mono" style={{ color: emeraldColor }}>
                      Rp {formatCurrency(pProfit)}
                    </td>
                    <td className="font-mono" style={{ color: 'var(--primary)', fontWeight: '700' }}>
                      Rp {formatCurrency(pSellingPrice)}
                    </td>
                    <td className="font-mono" style={{ color: emeraldColor, fontWeight: '700' }}>
                      Rp {formatCurrency(pNettPrice)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          marginTop: '1.5rem',
          padding: '0.95rem 1.2rem',
          background: isLight ? '#eff8ff' : 'rgba(0, 168, 255, 0.08)',
          border: `1px solid ${isLight ? '#bae6fd' : 'rgba(0, 168, 255, 0.25)'}`,
          borderRadius: '10px',
          textAlign: 'center',
          fontSize: '0.86rem',
          color: 'var(--text-main)'
        }}
      >
        Everything look good? Click <strong>Confirm &amp; Save</strong> below to record this booking.
      </div>

      {showSettlementModal && (
        <TourSettlementModal
          tour={data}
          onClose={() => setShowSettlementModal(false)}
        />
      )}
    </div>
  );
};

export default Step4Confirmation;
