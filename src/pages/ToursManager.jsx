import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  UploadCloud, Plus, PieChart, List, BarChart3, Edit3
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import TourWizard from '../components/tours/TourWizard';
import DatabaseTable from '../components/tours/DatabaseTable';
import TourSummary from '../components/tours/TourSummary';
import TourReporting from '../components/tours/TourReporting';
import CsvImportUtility from '../components/CsvImportUtility';
import { useTours } from '../context/TourContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { parseSpreadsheetAmount } from '../utils/tourHelpers';

const IMPORT_TEMPLATE_HEADERS = [
  'Tour Code',
  'Booking Code',
  'Nomor DP',
  'Nominal DP',
  'Destination',
  'Category',
  'Departure Date',
  'Return Date',
  'Pax Count',
  'Status Booking',
  'PIC Staff',
  'Harga Dasar Tour',
  'Discount Supplier',
  'Discount Branch',
  'Nominal Profit',
  'Nomor Invoice',
  'Status Form Claim MDR'
];

const ToursManager = () => {
  const location = useLocation();
  const { tours, bulkImportTours } = useTours();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state?.openNew) return 'wizard';
    if (location.state?.openTab) return location.state.openTab;
    return 'summary';
  });
  const [editingTour, setEditingTour] = useState(null);
  const [duplicateSeed, setDuplicateSeed] = useState(null);
  const [newWizardCount, setNewWizardCount] = useState(0);
  const [showImport, setShowImport] = useState(false);

  // Drill-down seed for All Bookings (scope + search)
  const [tableSeed, setTableSeed] = useState({
    key: 'default',
    scope: 'active',
    search: ''
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebarOnMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  // Tab badge counts
  const tabStats = useMemo(() => {
    let activeCount = 0;
    let followUpCount = 0;

    tours.forEach((t) => {
      const isCancelled = t.status === 'Cancel' || t.status === 'Cancelled';
      const isPast = t.status === 'Past Date';
      if (!isCancelled && !isPast) activeCount += 1;

      if (!isCancelled) {
        const fin = t.financials || {};
        const omset = Number(fin.totalSellingPrice ?? fin.totalOmset ?? 0);
        const dep = Number(fin.depositAmount || 0);
        const sisa = Math.max(0, omset - dep);
        const hasInv = Boolean(fin.invoiceNumber && String(fin.invoiceNumber).trim() !== '');
        const hasMdr = Boolean(t.claimMdr || t.internals?.claimMdr);
        if (!hasInv || sisa > 0 || !hasMdr) followUpCount += 1;
      }
    });

    return {
      total: tours.length,
      activeCount,
      followUpCount
    };
  }, [tours]);

  const handleStartNewBooking = () => {
    setEditingTour(null);
    setDuplicateSeed(null);
    setNewWizardCount((c) => c + 1);
    setActiveTab('wizard');
  };

  const handleEditTour = (tour) => {
    setDuplicateSeed(null);
    setEditingTour(tour);
    setActiveTab('wizard');
  };

  const handleDuplicateTour = (tour) => {
    const fin = tour.financials || {};
    const clonedPax = Array.isArray(tour.paxInfo)
      ? tour.paxInfo.map((p, idx) => ({
          ...p,
          id: `dup-pax-${Date.now()}-${idx}`
        }))
      : [];

    setEditingTour(null);
    setDuplicateSeed({
      _seedKey: `dup-${Date.now()}`,
      tourCode: tour.tourCode || '',
      bookingCode: '',
      country: tour.country || '',
      category: tour.category || 'Leisure',
      departureDate: tour.departureDate || '',
      returnDate: tour.returnDate || '',
      paxCount: tour.paxCount || 1,
      staffName: tour.staffName || '',
      status: 'Pending',
      claimMdr: false,
      claimMdrAt: null,
      claimMdrBy: '',
      paxInfo: clonedPax,
      financials: {
        ...fin,
        depositNumber: '',
        depositAmount: 0,
        sisaPelunasan: Number(fin.totalSellingPrice ?? fin.totalOmset ?? 0),
        invoiceNumber: ''
      }
    });
    setActiveTab('wizard');
    toast.info('Duplicated tour template — enter a new Booking Code & Nomor DP.');
  };

  const handleDrillToBookings = (targetScope = 'active', targetSearch = '') => {
    setTableSeed({
      key: `drill-${Date.now()}`,
      scope: targetScope,
      search: targetSearch
    });
    setEditingTour(null);
    setDuplicateSeed(null);
    setActiveTab('database');
  };

  const handleImportData = async (data) => {
    try {
      const mappedData = data.map((row) => {
        const basicTourPrice = parseSpreadsheetAmount(
          row['Harga Dasar Tour'] ?? row['Basic Tour Price'] ?? row['Harga Dasar'] ?? 0
        );
        const discountSupplier = parseSpreadsheetAmount(
          row['Discount Supplier'] ?? row['Disc Supplier'] ?? 0
        );
        const discountBranch = parseSpreadsheetAmount(
          row['Discount Branch'] ?? row['Disc Branch'] ?? 0
        );
        const profit = parseSpreadsheetAmount(
          row['Nominal Profit'] ?? row['Profit'] ?? 0
        );
        const totalSellingPrice =
          parseSpreadsheetAmount(
            row['Total Selling Price (Omset)'] ??
              row['Total Selling Price'] ??
              row['Total Omset'] ??
              0
          ) || basicTourPrice - discountSupplier - discountBranch;
        const totalNettPrice =
          parseSpreadsheetAmount(
            row['Total Nett Price (Cost)'] ?? row['Total Nett Price'] ?? row['Cost'] ?? 0
          ) || basicTourPrice - discountSupplier - profit;

        const depositNumber = String(
          row['Nomor DP'] ?? row['Deposit Number'] ?? row['Deposit'] ?? ''
        ).trim();
        const depositAmount = parseSpreadsheetAmount(
          row['Nominal DP'] ?? row['Deposit Amount'] ?? 0
        );
        const sisaPelunasan = Math.max(0, totalSellingPrice - depositAmount);
        const invoiceNumber = String(
          row['Nomor Invoice'] ?? row['Invoice Number'] ?? row['Invoice'] ?? ''
        ).trim();

        const rawClaimMdr =
          row['Status Form Claim MDR'] ?? row['Form Claim MDR'] ?? row['Claim MDR'] ?? '';
        const isClaimMdr = [
          'true',
          'yes',
          'sudah',
          'sudah claim',
          'claimed',
          'checked',
          '1'
        ].includes(String(rawClaimMdr).toLowerCase().trim());

        const claimMdrAt =
          row['Tanggal & Jam Claim MDR'] ||
          row['Claim MDR At'] ||
          (isClaimMdr ? new Date().toISOString() : null);
        const claimMdrBy =
          row['PIC Claim MDR'] ||
          (isClaimMdr ? row['PIC Staff'] || row['Staff Name'] || 'Staff' : null);

        return {
          tourCode: row['Tour Code'] || '',
          bookingCode: row['Booking Code'] || '',
          country: row['Destination'] || row['Country'] || 'Unknown',
          category: row['Category'] || 'Leisure',
          departureDate: row['Departure Date'] || '',
          returnDate: row['Return Date'] || '',
          paxCount: parseInt(row['Pax Count'], 10) || 1,
          status: row['Status Booking'] || row['Status'] || 'Pending',
          staffName: row['PIC Staff'] || row['Staff Name'] || '',
          claimMdr: isClaimMdr,
          claimMdrAt,
          claimMdrBy,
          financials: {
            basicTourPrice,
            totalSales: basicTourPrice,
            discountSupplier,
            discountBranch,
            discount: discountSupplier + discountBranch,
            profit,
            totalSellingPrice,
            totalOmset: totalSellingPrice,
            totalNettPrice,
            cost: totalNettPrice,
            depositNumber,
            depositAmount,
            sisaPelunasan,
            invoiceNumber
          }
        };
      });

      await bulkImportTours(mappedData);
      toast.success(`Imported ${mappedData.length} tour booking(s) into your workspace!`);
      setShowImport(false);
      setTableSeed({ key: `import-${Date.now()}`, scope: 'all', search: '' });
      setActiveTab('database');
    } catch (err) {
      toast.error('Unable to import spreadsheet: ' + err.message);
    }
  };

  const wizardKey = editingTour
    ? `edit-${editingTour.id}`
    : duplicateSeed
      ? duplicateSeed._seedKey
      : `new-${newWizardCount}`;

  const renderContent = () => {
    switch (activeTab) {
      case 'wizard':
        return (
          <TourWizard
            key={wizardKey}
            initialData={editingTour || duplicateSeed}
            prefillDate={!editingTour && !duplicateSeed ? location.state?.prefillDate : ''}
            onComplete={() => {
              setEditingTour(null);
              setDuplicateSeed(null);
              setActiveTab('database');
            }}
            onCancel={() => {
              setEditingTour(null);
              setDuplicateSeed(null);
              setActiveTab('database');
            }}
          />
        );
      case 'database':
        return (
          <DatabaseTable
            key={tableSeed.key}
            onEdit={handleEditTour}
            onDuplicate={handleDuplicateTour}
            initialScope={tableSeed.scope}
            initialSearch={tableSeed.search}
          />
        );
      case 'summary':
        return <TourSummary onDrillToBookings={handleDrillToBookings} />;
      case 'reporting':
        return <TourReporting onDrillToBookings={handleDrillToBookings} />;
      default:
        return (
          <DatabaseTable
            key={tableSeed.key}
            onEdit={handleEditTour}
            onDuplicate={handleDuplicateTour}
          />
        );
    }
  };

  return (
    <div className="app-container fade-in">
      <div
        className={`overlay ${isSidebarOpen ? '' : 'hidden'}`}
        onClick={closeSidebarOnMobile}
      />

      <Sidebar isOpen={isSidebarOpen} closeMobile={closeSidebarOnMobile} />

      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />

        <div className="content-area">
          <div className="page-container">
            <div
              className="section-title"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <div>
                <span>Tours &amp; Group Trips</span>
                <p
                  style={{
                    margin: '0.2rem 0 0 0',
                    fontSize: '0.84rem',
                    fontWeight: '400',
                    color: 'var(--text-muted)'
                  }}
                >
                  Manage group itineraries, traveler manifests, DP receipts, and settlement invoices in one place.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowImport(!showImport)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.84rem', padding: '0.55rem 1rem' }}
                >
                  <UploadCloud size={16} color="var(--primary)" /> Import Excel / CSV
                </button>
                <button
                  type="button"
                  onClick={handleStartNewBooking}
                  className="btn btn-primary"
                  style={{ fontSize: '0.84rem', padding: '0.55rem 1.05rem' }}
                >
                  <Plus size={16} /> New Tour Booking
                </button>
              </div>
            </div>

            {showImport && (
              <CsvImportUtility
                onImport={handleImportData}
                templateHeaders={IMPORT_TEMPLATE_HEADERS}
              />
            )}

            <div className="tabs-container">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('summary');
                  setEditingTour(null);
                  setDuplicateSeed(null);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <PieChart size={15} /> Overview
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('database');
                  setEditingTour(null);
                  setDuplicateSeed(null);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <List size={15} /> All Bookings
                <span
                  style={{
                    padding: '0.06rem 0.45rem',
                    borderRadius: '9999px',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    background:
                      activeTab === 'database'
                        ? 'rgba(0, 168, 255, 0.18)'
                        : isLight ? '#eff8ff' : 'rgba(255, 255, 255, 0.07)',
                    color: activeTab === 'database' ? 'var(--primary)' : 'var(--text-muted)'
                  }}
                >
                  {tabStats.total}
                </span>
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === 'reporting' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('reporting');
                  setEditingTour(null);
                  setDuplicateSeed(null);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <BarChart3 size={15} /> Reports &amp; Insights
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === 'wizard' ? 'active' : ''}`}
                onClick={() => setActiveTab('wizard')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                {editingTour ? (
                  <>
                    <Edit3 size={15} /> Edit Booking
                  </>
                ) : duplicateSeed ? (
                  <>
                    <Plus size={15} /> Duplicate Draft
                  </>
                ) : (
                  <>
                    <Plus size={15} /> Add Booking
                  </>
                )}
              </button>
            </div>

            <div className="tab-content">{renderContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToursManager;
