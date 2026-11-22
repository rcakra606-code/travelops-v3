import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  UploadCloud, Plus, PieChart, List, BarChart3, Edit3, Compass, Briefcase, Network, Sparkles
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import BiPageHeader from '../components/bi/BiPageHeader';
import TourWizard from '../components/tours/TourWizard';
import TourAiImportModal from '../components/tours/TourAiImportModal';
import DatabaseTable from '../components/tours/DatabaseTable';
import TourSummary from '../components/tours/TourSummary';
import TourReporting from '../components/tours/TourReporting';
import CsvImportUtility from '../components/CsvImportUtility';
import { useTours } from '../context/TourContext';
import { useToast } from '../context/ToastContext';
import { parseSpreadsheetAmount } from '../utils/tourHelpers';

const IMPORT_TEMPLATE_HEADERS = [
  'Tour Type',
  'Supplier',
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state?.openNew) return 'wizard';
    if (location.state?.openId) return location.state?.openTab || 'database';
    if (location.state?.openTab) return location.state.openTab;
    return 'summary';
  });
  const [editingTour, setEditingTour] = useState(null);
  const [duplicateSeed, setDuplicateSeed] = useState(null);
  const [aiDraftSeed, setAiDraftSeed] = useState(null);
  const [newWizardCount, setNewWizardCount] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const [showAiImportModal, setShowAiImportModal] = useState(false);

  // Drill-down seed for All Bookings (scope + search + deep-link openId)
  const [tableSeed, setTableSeed] = useState(() => ({
    key: location.state?._ts ? `nav-${location.state._ts}` : 'default',
    scope: location.state?.openId ? 'all' : location.state?.scope || 'active',
    search: location.state?.search || '',
    openId: location.state?.openId || null
  }));

  // Handle deep-link / Quick Create navigation even when already mounted on /tours
  const navTs = location.state?._ts || null;
  const [lastNavTs, setLastNavTs] = useState(navTs);
  if (navTs && navTs !== lastNavTs) {
    setLastNavTs(navTs);
    if (location.state?.openNew) {
      setEditingTour(null);
      setDuplicateSeed(null);
      setNewWizardCount((c) => c + 1);
      setActiveTab('wizard');
    } else if (location.state?.openId || location.state?.openTab) {
      setTableSeed({
        key: `nav-${navTs}`,
        scope: location.state?.openId ? 'all' : location.state?.scope || 'active',
        search: location.state?.search || '',
        openId: location.state?.openId || null
      });
      setEditingTour(null);
      setDuplicateSeed(null);
      setActiveTab(location.state?.openTab || 'database');
    }
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebarOnMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  // Tab badge counts
  const tabStats = useMemo(() => {
    let activeCount = 0;
    let followUpCount = 0;
    let seriesCount = 0;
    let incentiveCount = 0;
    let consortiumCount = 0;

    tours.forEach((t) => {
      const type =
        t.tourType ||
        (t.category === 'Consortium'
          ? 'Consortium'
          : t.category === 'Corporate / Incentive'
            ? 'Incentive'
            : 'Series');
      if (type === 'Series') seriesCount += 1;
      else if (type === 'Incentive') incentiveCount += 1;
      else if (type === 'Consortium') consortiumCount += 1;

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
        if (!hasInv || sisa > 0 || (type === 'Series' && !hasMdr)) followUpCount += 1;
      }
    });

    return {
      total: tours.length,
      activeCount,
      followUpCount,
      seriesCount,
      incentiveCount,
      consortiumCount
    };
  }, [tours]);

  const handleStartNewBooking = () => {
    setEditingTour(null);
    setDuplicateSeed(null);
    setAiDraftSeed(null);
    setNewWizardCount((c) => c + 1);
    setActiveTab('wizard');
  };

  const handleEditTour = (tour) => {
    setDuplicateSeed(null);
    setAiDraftSeed(null);
    setEditingTour(tour);
    setActiveTab('wizard');
  };

  const handleApplyAiDraft = (draft) => {
    setEditingTour(null);
    setDuplicateSeed(null);
    setAiDraftSeed(draft);
    setShowAiImportModal(false);
    setActiveTab('wizard');
    toast.info('Draft AI dimuat — harap cek peringatan & lengkapi Kode Booking, Nomor DP, dan Profit sebelum menyimpan.');
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

        const rawTourType = row['Tour Type'] || row['Jenis Tour'] || row['Category'] || 'Series';
        const normalizedTourType = ['Series', 'Incentive', 'Consortium'].includes(rawTourType)
          ? rawTourType
          : rawTourType.toLowerCase().includes('incentive') || rawTourType.toLowerCase().includes('corporate')
            ? 'Incentive'
            : rawTourType.toLowerCase().includes('consortium')
              ? 'Consortium'
              : 'Series';
        const supplier = String(row['Supplier'] || row['Supplier Partner'] || '').trim();

        return {
          tourType: normalizedTourType,
          supplier,
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
    : aiDraftSeed
      ? aiDraftSeed._seedKey
      : duplicateSeed
        ? duplicateSeed._seedKey
        : `new-${newWizardCount}`;

  const renderContent = () => {
    switch (activeTab) {
      case 'wizard':
        return (
          <TourWizard
            key={wizardKey}
            initialData={editingTour || aiDraftSeed || duplicateSeed}
            initialStep={aiDraftSeed ? 2 : 1}
            prefillDate={!editingTour && !duplicateSeed && !aiDraftSeed ? location.state?.prefillDate : ''}
            onOpenAiImport={() => setShowAiImportModal(true)}
            onComplete={() => {
              const target = editingTour?.tourType?.toLowerCase() || 'database';
              setEditingTour(null);
              setDuplicateSeed(null);
              setAiDraftSeed(null);
              setActiveTab(['series', 'incentive', 'consortium'].includes(target) ? target : 'database');
            }}
            onCancel={() => {
              setEditingTour(null);
              setDuplicateSeed(null);
              setAiDraftSeed(null);
              setActiveTab('database');
            }}
          />
        );
      case 'series':
        return (
          <DatabaseTable
            key={`series-${tableSeed.key}`}
            tourTypeFilter="Series"
            onEdit={handleEditTour}
            onDuplicate={handleDuplicateTour}
            initialScope={tableSeed.scope}
            initialSearch={tableSeed.search}
          />
        );
      case 'incentive':
        return (
          <DatabaseTable
            key={`incentive-${tableSeed.key}`}
            tourTypeFilter="Incentive"
            onEdit={handleEditTour}
            onDuplicate={handleDuplicateTour}
            initialScope={tableSeed.scope}
            initialSearch={tableSeed.search}
          />
        );
      case 'consortium':
        return (
          <DatabaseTable
            key={`consortium-${tableSeed.key}`}
            tourTypeFilter="Consortium"
            onEdit={handleEditTour}
            onDuplicate={handleDuplicateTour}
            initialScope={tableSeed.scope}
            initialSearch={tableSeed.search}
          />
        );
      case 'database':
        return (
          <DatabaseTable
            key={`all-${tableSeed.key}`}
            tourTypeFilter="All"
            onEdit={handleEditTour}
            onDuplicate={handleDuplicateTour}
            initialScope={tableSeed.scope}
            initialSearch={tableSeed.search}
            initialOpenId={tableSeed.openId}
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
            tourTypeFilter="All"
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
            <BiPageHeader
              eyebrow="OPERATIONS & MANIFEST"
              title="Tours & Group Trips"
              subtitle="Manage group itineraries, traveler manifests, DP receipts, and settlement invoices in one place."
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => setShowAiImportModal(true)}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.82rem',
                      padding: '0.5rem 0.9rem',
                      borderColor: 'var(--border-glow)',
                      background: 'var(--primary-soft)',
                      color: 'var(--primary)'
                    }}
                  >
                    <Sparkles size={15} /> AI Auto-Fill (PDF / Foto)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImport(!showImport)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem' }}
                  >
                    <UploadCloud size={15} /> Import Excel / CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleStartNewBooking}
                    className="btn btn-primary"
                    style={{ fontSize: '0.82rem', padding: '0.5rem 0.95rem' }}
                  >
                    <Plus size={15} /> New Tour Booking
                  </button>
                </>
              }
            />

            {showImport && (
              <CsvImportUtility
                onImport={handleImportData}
                templateHeaders={IMPORT_TEMPLATE_HEADERS}
              />
            )}

            <div role="tablist" aria-label="Tours Module Views" className="tabs-container">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'summary'}
                className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('summary');
                  setEditingTour(null);
                  setDuplicateSeed(null);
                }}
              >
                <PieChart size={15} aria-hidden="true" /> Overview
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'series'}
                className={`tab-btn ${activeTab === 'series' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('series');
                  setEditingTour(null);
                  setDuplicateSeed(null);
                }}
              >
                <Compass size={15} aria-hidden="true" /> Series
                <span className="bi-micro-badge tabular-nums">{tabStats.seriesCount}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'incentive'}
                className={`tab-btn ${activeTab === 'incentive' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('incentive');
                  setEditingTour(null);
                  setDuplicateSeed(null);
                }}
              >
                <Briefcase size={15} aria-hidden="true" /> Incentive
                <span className="bi-micro-badge tabular-nums">{tabStats.incentiveCount}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'consortium'}
                className={`tab-btn ${activeTab === 'consortium' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('consortium');
                  setEditingTour(null);
                  setDuplicateSeed(null);
                }}
              >
                <Network size={15} aria-hidden="true" /> Consortium
                <span className="bi-micro-badge tabular-nums">{tabStats.consortiumCount}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'database'}
                className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('database');
                  setEditingTour(null);
                  setDuplicateSeed(null);
                }}
              >
                <List size={15} aria-hidden="true" /> All Bookings
                <span className="bi-micro-badge tabular-nums">{tabStats.total}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'reporting'}
                className={`tab-btn ${activeTab === 'reporting' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('reporting');
                  setEditingTour(null);
                  setDuplicateSeed(null);
                }}
              >
                <BarChart3 size={15} aria-hidden="true" /> Reports &amp; Insights
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'wizard'}
                className={`tab-btn ${activeTab === 'wizard' ? 'active' : ''}`}
                onClick={() => setActiveTab('wizard')}
              >
                {editingTour ? (
                  <>
                    <Edit3 size={15} aria-hidden="true" /> Edit Booking
                  </>
                ) : aiDraftSeed ? (
                  <>
                    <Sparkles size={15} aria-hidden="true" /> AI Draft
                  </>
                ) : duplicateSeed ? (
                  <>
                    <Plus size={15} aria-hidden="true" /> Duplicate Draft
                  </>
                ) : (
                  <>
                    <Plus size={15} aria-hidden="true" /> Add Booking
                  </>
                )}
              </button>
            </div>

            <div className="tab-content">{renderContent()}</div>
          </div>
        </div>
      </div>

      <TourAiImportModal
        isOpen={showAiImportModal}
        onClose={() => setShowAiImportModal(false)}
        onApplyDraft={handleApplyAiDraft}
      />
    </div>
  );
};

export default ToursManager;
