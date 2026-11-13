import { useState, useMemo } from 'react';
import { Check, MapPin, Calendar, Users, Sparkles, Building2 } from 'lucide-react';
import Step1TourType from './steps/Step1TourType';
import Step1TourInfo from './steps/Step1TourInfo';
import Step2PaxInfo from './steps/Step2PaxInfo';
import Step3Financials from './steps/Step3Financials';
import Step4Confirmation from './steps/Step4Confirmation';
import ConfirmModal from '../ConfirmModal';
import { useTours } from '../../context/TourContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useFormDraft } from '../../hooks/useFormDraft';
import { formatCurrency } from '../../utils/currency';
import {
  resizePaxList,
  hasPerPaxPricing,
  computeFinancialsFromPax,
  getTripDurationInfo,
  formatShortDate
} from '../../utils/tourHelpers';

const STEPS = [
  { id: 1, title: 'Jenis Tour' },
  { id: 2, title: 'Tour Info' },
  { id: 3, title: 'Travelers' },
  { id: 4, title: 'Financials' },
  { id: 5, title: 'Confirm' }
];

const buildInitialWizardState = (initialData, prefillDate, defaultStaffName) => {
  if (initialData) {
    const fin = initialData.financials || {};
    const tourType =
      initialData.tourType ||
      (initialData.category === 'Consortium'
        ? 'Consortium'
        : initialData.category === 'Corporate / Incentive'
          ? 'Incentive'
          : 'Series');
    const supplier = initialData.supplier || '';
    const airportTax = Number(fin.airportTax || 0);
    const tipping = Number(fin.tipping || 0);
    const miscCharge = Number(fin.miscCharge || 0);
    const ppn = Number(fin.ppn || 0);
    const basicTourPrice = Number(
      fin.basicTourPrice !== undefined ? fin.basicTourPrice : fin.totalSales || 0
    );
    const discountSupplier = Number(
      fin.discountSupplier !== undefined ? fin.discountSupplier : fin.discount || 0
    );
    const discountBranch = Number(
      fin.discountBranch !== undefined ? fin.discountBranch : 0
    );
    const profit = Number(fin.profit || 0);
    const isConsortium = tourType === 'Consortium';
    const totalAddons = isConsortium ? airportTax + tipping + miscCharge + ppn : 0;
    const totalSellingPrice = Number(
      fin.totalSellingPrice !== undefined
        ? fin.totalSellingPrice
        : fin.totalOmset || (basicTourPrice + totalAddons - discountSupplier - discountBranch)
    );
    const totalNettPrice = Number(
      fin.totalNettPrice !== undefined
        ? fin.totalNettPrice
        : fin.cost || (totalSellingPrice - profit)
    );
    const depositAmount = Number(fin.depositAmount || 0);
    const sisaPelunasan = totalSellingPrice - depositAmount;
    const paxCount = Math.max(1, parseInt(initialData.paxCount, 10) || 1);

    const mappedPax = Array.isArray(initialData.paxInfo)
      ? initialData.paxInfo.map((p) => ({
          ...p,
          basicPrice: p.basicPrice !== undefined ? p.basicPrice : p.sellingPrice || '',
          sellingPrice: p.sellingPrice !== undefined ? p.sellingPrice : p.basicPrice || '',
          airportTax: p.airportTax || '',
          tipping: p.tipping || '',
          miscCharge: p.miscCharge || '',
          ppn: p.ppn || '',
          profit: p.profit || '',
          discountSupplier:
            p.discountSupplier !== undefined ? p.discountSupplier : p.discount || '',
          discountBranch: p.discountBranch !== undefined ? p.discountBranch : ''
        }))
      : [];

    const paxInfo = resizePaxList(mappedPax, paxCount);
    const claimMdr = Boolean(
      tourType === 'Series' &&
        (initialData.claimMdr !== undefined
          ? initialData.claimMdr
          : initialData.internals?.claimMdr)
    );
    const claimMdrAt = initialData.claimMdrAt || initialData.internals?.claimMdrAt || null;
    const claimMdrBy = initialData.claimMdrBy || initialData.internals?.claimMdrBy || '';

    return {
      ...initialData,
      tourType,
      supplier,
      category: initialData.category || (tourType === 'Consortium' ? 'Consortium' : tourType === 'Incentive' ? 'Corporate / Incentive' : 'Leisure'),
      paxCount,
      paxInfo,
      claimMdr,
      claimMdrAt,
      claimMdrBy,
      financials: {
        ...fin,
        basicTourPrice,
        totalSales: basicTourPrice,
        airportTax,
        tipping,
        miscCharge,
        ppn,
        discountSupplier,
        discountBranch,
        discount: discountSupplier + discountBranch,
        profit,
        totalSellingPrice,
        totalOmset: totalSellingPrice,
        totalNettPrice,
        cost: totalNettPrice,
        depositNumber: fin.depositNumber || '',
        depositAmount,
        sisaPelunasan,
        invoiceNumber: fin.invoiceNumber || '',
        discountLink: fin.discountLink || ''
      }
    };
  }

  return {
    tourType: 'Series',
    supplier: '',
    tourCode: '',
    bookingCode: '',
    departureDate: prefillDate || '',
    returnDate: '',
    country: '',
    category: 'Leisure',
    paxCount: 1,
    staffName: defaultStaffName || '',
    status: 'Pending',
    claimMdr: false,
    claimMdrAt: null,
    claimMdrBy: '',
    paxInfo: resizePaxList([], 1),
    financials: {
      basicTourPrice: 0,
      totalSales: 0,
      airportTax: 0,
      tipping: 0,
      miscCharge: 0,
      ppn: 0,
      discountSupplier: 0,
      discountBranch: 0,
      discount: 0,
      profit: 0,
      totalSellingPrice: 0,
      totalOmset: 0,
      totalNettPrice: 0,
      cost: 0,
      depositNumber: '',
      depositAmount: 0,
      sisaPelunasan: 0,
      invoiceNumber: '',
      discountLink: ''
    }
  };
};

const TourWizard = ({ initialData, prefillDate, onComplete, onCancel }) => {
  const { addTour, updateTour } = useTours();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const isLight = theme === 'light';

  const isEditingExisting = Boolean(initialData?.id);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [tourData, setTourData] = useState(() =>
    buildInitialWizardState(
      initialData,
      prefillDate,
      (user?.role || '').toLowerCase() === 'admin' ? '' : user?.name
    )
  );

  const isBrandNewTour = !isEditingExisting && !initialData;
  const { hasSavedDraft, draftSavedAt, restoreDraft, clearDraft } = useFormDraft(
    'new_tour',
    tourData,
    setTourData,
    isBrandNewTour
  );

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const isDirty = useMemo(() => {
    if (isEditingExisting) {
      return (
        tourData.country !== initialData?.country ||
        tourData.departureDate !== initialData?.departureDate ||
        tourData.bookingCode !== initialData?.bookingCode ||
        tourData.tourCode !== initialData?.tourCode
      );
    }
    return Boolean(
      tourData.country?.trim() ||
      tourData.departureDate ||
      tourData.bookingCode?.trim() ||
      tourData.tourCode?.trim() ||
      Number(tourData.financials?.basicTourPrice || 0) > 0
    );
  }, [tourData, initialData, isEditingExisting]);

  const handleRequestCancel = () => {
    if (isDirty) {
      setShowLeaveConfirm(true);
    } else if (onCancel) {
      onCancel();
    }
  };

  const clearError = (field) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
  };

  const updateTourData = (newData) => {
    setTourData((prev) => ({ ...prev, ...newData }));
    if (newData.financials?.depositNumber?.trim()) {
      clearError('depositNumber');
    }
  };

  const validateStep2 = () => {
    const nextErrors = {};
    if (!tourData.country || !String(tourData.country).trim()) {
      nextErrors.country = 'Please enter a destination country';
    }
    if (!tourData.departureDate) {
      nextErrors.departureDate = 'Departure date is required';
    }
    const dur = getTripDurationInfo(tourData.departureDate, tourData.returnDate);
    if (dur && !dur.valid) {
      nextErrors.dateOrder = 'Return date cannot be earlier than departure date';
    }
    if (
      (tourData.tourType === 'Incentive' || tourData.tourType === 'Consortium') &&
      !tourData.supplier?.trim()
    ) {
      nextErrors.supplier = 'Supplier / Wholesaler Mitra is required';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      toast.warning(
        nextErrors.dateOrder ||
          nextErrors.supplier ||
          nextErrors.country ||
          nextErrors.departureDate ||
          'Please complete required tour details in Step 2.'
      );
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    const depositNumber = tourData.financials?.depositNumber
      ? String(tourData.financials.depositNumber).trim()
      : '';
    if (!depositNumber) {
      setErrors((prev) => ({
        ...prev,
        depositNumber: 'Nomor DP (Deposit Number) is required before saving to the database.'
      }));
      toast.warning('Please enter Nomor DP (Deposit Number) in Step 4 Financials.');
      return false;
    }
    setErrors((prev) => ({ ...prev, depositNumber: null }));
    return true;
  };

  const syncFinancialsIfPerPax = () => {
    if (hasPerPaxPricing(tourData.paxInfo)) {
      setTourData((prev) => ({
        ...prev,
        financials: computeFinancialsFromPax(prev.paxInfo, prev.financials, prev.tourType || 'Series')
      }));
    }
  };

  const goToStep = (targetStep) => {
    if (targetStep === currentStep) return;

    if (targetStep > currentStep) {
      if (currentStep === 2 && !validateStep2()) return;
      if (targetStep >= 3 && currentStep < 2 && !validateStep2()) {
        setCurrentStep(2);
        return;
      }
      if (targetStep === 5) {
        if (!validateStep2()) {
          setCurrentStep(2);
          return;
        }
        if (!validateStep4()) {
          setCurrentStep(4);
          return;
        }
      }
    }

    syncFinancialsIfPerPax();
    setCurrentStep(targetStep);
  };

  const handleNext = () => {
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 4 && !validateStep4()) return;
    if (currentStep < 5) {
      syncFinancialsIfPerPax();
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      handleRequestCancel();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }
    if (!validateStep4()) {
      setCurrentStep(4);
      return;
    }

    setIsSaving(true);
    try {
      const syncedFinancials = hasPerPaxPricing(tourData.paxInfo)
        ? computeFinancialsFromPax(tourData.paxInfo, tourData.financials, tourData.tourType || 'Series')
        : tourData.financials;

      const cleanTourData = { ...tourData };
      delete cleanTourData._seedKey;
      const dataToSave = {
        ...cleanTourData,
        financials: syncedFinancials,
        updatedBy: user?.name || 'System',
        userRole: user?.role
      };

      if (isEditingExisting) {
        await updateTour(initialData.id, dataToSave);
        toast.success(`Tour booking ${dataToSave.bookingCode || dataToSave.tourCode || ''} updated!`);
      } else {
        await addTour(dataToSave);
        clearDraft();
        toast.success(`New tour booking ${dataToSave.bookingCode || dataToSave.tourCode || ''} saved!`);
      }
      onComplete();
    } catch (err) {
      toast.error('Unable to save booking: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const liveFinancials = hasPerPaxPricing(tourData.paxInfo)
    ? computeFinancialsFromPax(tourData.paxInfo, tourData.financials, tourData.tourType || 'Series')
    : tourData.financials || {};
  const liveOmset = Number(liveFinancials.totalSellingPrice || liveFinancials.totalOmset || 0);
  const liveProfit = Number(liveFinancials.profit || 0);
  const liveMargin = liveOmset > 0 ? ((liveProfit / liveOmset) * 100).toFixed(1) : '0.0';
  const liveDeposit = Number(liveFinancials.depositAmount || 0);
  const liveBalance = Math.max(0, liveOmset - liveDeposit);
  const liveSurcharges =
    Number(liveFinancials.airportTax || 0) +
    Number(liveFinancials.tipping || 0) +
    Number(liveFinancials.ppn || 0) +
    Number(liveFinancials.miscCharge || 0);

  return (
    <div className="card wizard-container fade-in">
      {/* Draft Recovery Alert */}
      {hasSavedDraft && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            background: isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: isLight ? '#0369a1' : '#38bdf8' }}>
            <Sparkles size={16} />
            <span>
              <strong>Draft Pembuatan Tour Ditemukan</strong>
              {draftSavedAt ? ` (tersimpan pk ${draftSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}.
              Lanjutkan pengisian form sebelumnya?
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={restoreDraft}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 14px',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Pulihkan Draft
            </button>
            <button
              type="button"
              onClick={clearDraft}
              style={{
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '0.825rem',
                cursor: 'pointer'
              }}
            >
              Abaikan
            </button>
          </div>
        </div>
      )}

      {/* Live Context Pill Strip */}
      {(tourData.country || tourData.departureDate || liveOmset > 0) && (
        <div
          className="flex items-center justify-between flex-wrap gap-2.5 px-4 py-2.5 mb-5 rounded-xl bg-slate-50 dark:bg-white/5 border border-border text-xs"
          style={{ padding: '0.75rem 1.25rem', marginBottom: '1.25rem' }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-extrabold text-primary">
              {isEditingExisting
                ? `Editing: ${tourData.bookingCode || tourData.tourCode || initialData.id}`
                : initialData
                  ? 'Duplicated Draft'
                  : 'New Tour Draft'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-extrabold ${
                tourData.tourType === 'Consortium'
                  ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400'
                  : tourData.tourType === 'Incentive'
                    ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                    : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
              }`}
            >
              {tourData.tourType || 'Series'} Tour
            </span>
            {tourData.supplier && (
              <span className="inline-flex items-center gap-1 text-text-main font-semibold">
                <Building2 size={13} className="text-primary" /> {tourData.supplier}
              </span>
            )}
            {tourData.country && (
              <span className="inline-flex items-center gap-1 text-text-main font-semibold">
                <MapPin size={13} className="text-primary" /> {tourData.country}
              </span>
            )}
            {tourData.departureDate && (
              <span className="inline-flex items-center gap-1 text-text-muted">
                <Calendar size={13} /> {formatShortDate(tourData.departureDate)}
                {tourData.returnDate ? ` → ${formatShortDate(tourData.returnDate)}` : ''}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-text-muted">
              <Users size={13} /> {tourData.paxCount} Pax
            </span>
          </div>

          {liveOmset > 0 && (
            <span className="font-mono font-extrabold text-primary">
              Omset: Rp {formatCurrency(liveOmset)}
            </span>
          )}
        </div>
      )}

      {/* DESKTOP CLICKABLE STEPPER */}
      <div className="wizard-steps desktop-only">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => goToStep(step.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.45rem',
                zIndex: 1,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0 0.35rem'
              }}
              title={`Jump to Step ${step.id}: ${step.title}`}
            >
              <div
                className={`step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                {isCompleted ? <Check size={16} /> : step.id}
              </div>
              <span
                style={{
                  fontSize: '0.76rem',
                  fontWeight: isActive ? '700' : '500',
                  color: currentStep >= step.id ? 'var(--text-main)' : 'var(--text-muted)'
                }}
              >
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* MOBILE STEPPER */}
      <div
        className="mobile-only"
        style={{
          marginBottom: '1.35rem',
          padding: '0.9rem 1rem',
          background: isLight ? '#f4f9ff' : 'var(--bg-dark)',
          borderRadius: '10px',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            Step {currentStep} of {STEPS.length}
          </span>
          <span style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--primary)' }}>
            {STEPS[currentStep - 1].title}
          </span>
        </div>
        <div
          style={{
            height: '6px',
            background: isLight ? '#dbeafe' : 'rgba(255, 255, 255, 0.1)',
            borderRadius: '9999px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(currentStep / STEPS.length) * 100}%`,
              background: 'linear-gradient(90deg, #00b4ff, #0077ff)',
              transition: 'width 0.3s ease-in-out'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.65rem' }}>
          {STEPS.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => goToStep(st.id)}
              style={{
                flex: 1,
                padding: '0.28rem 0.2rem',
                borderRadius: '6px',
                border: `1px solid ${currentStep === st.id ? 'var(--primary)' : 'var(--border)'}`,
                background:
                  currentStep === st.id
                    ? isLight ? '#e0f2fe' : 'rgba(0, 168, 255, 0.16)'
                    : 'transparent',
                color: currentStep === st.id ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '0.68rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {st.id}. {st.title}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Financial Sticky Bar on Steps 2, 3, 4 */}
      {currentStep >= 2 && currentStep <= 4 && (
        <div
          className="mb-5 p-3.5 sm:p-4 rounded-xl border border-sky-500/20 bg-gradient-to-r from-sky-500/[0.06] via-transparent to-emerald-500/[0.05] dark:from-sky-500/[0.08] dark:to-emerald-500/[0.07] backdrop-blur-sm shadow-sm transition-all duration-200"
          style={{ padding: '0.9rem 1.25rem', marginBottom: '1.25rem' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Left: Summary Items */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-text-muted">Pax:</span>
                <span className="font-bold font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {tourData.paxCount || 1} Pax
                </span>
              </div>

              <div className="hidden sm:block h-3.5 w-px bg-border/60" />

              <div className="flex items-center gap-1.5">
                <span className="text-text-muted">Total Omset:</span>
                <strong className="font-mono text-text-main text-xs sm:text-sm">
                  {liveOmset > 0 ? `Rp ${formatCurrency(liveOmset)}` : 'Rp 0'}
                </strong>
              </div>

              {tourData.tourType === 'Consortium' && (
                <>
                  <div className="hidden sm:block h-3.5 w-px bg-border/60" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-text-muted">Taxes &amp; Surcharges:</span>
                    <strong className="font-mono text-sky-600 dark:text-sky-400">
                      Rp {formatCurrency(liveSurcharges)}
                    </strong>
                  </div>
                </>
              )}

              <div className="hidden sm:block h-3.5 w-px bg-border/60" />

              <div className="flex items-center gap-1.5">
                <span className="text-text-muted">Est. Profit:</span>
                <strong
                  className={`font-mono text-xs sm:text-sm font-extrabold ${
                    liveProfit >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500'
                  }`}
                >
                  Rp {formatCurrency(liveProfit)}
                </strong>
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                    liveProfit >= 0
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {liveMargin}% Margin
                </span>
              </div>
            </div>

            {/* Right: Sisa Pelunasan */}
            <div className="flex items-center gap-2">
              <span className="text-text-muted">Sisa Pelunasan:</span>
              <strong className="font-mono text-text-main font-bold">
                {liveBalance > 0 ? `Rp ${formatCurrency(liveBalance)}` : 'LUNAS / DP Penuh'}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE STEP CONTENT */}
      <div className="wizard-content">
        {currentStep === 1 && (
          <Step1TourType
            data={tourData}
            updateData={updateTourData}
          />
        )}
        {currentStep === 2 && (
          <Step1TourInfo
            data={tourData}
            updateData={updateTourData}
            errors={errors}
            clearError={clearError}
          />
        )}
        {currentStep === 3 && (
          <Step2PaxInfo data={tourData} updateData={updateTourData} />
        )}
        {currentStep === 4 && (
          <Step3Financials
            data={tourData}
            updateData={updateTourData}
            errors={errors}
            setErrors={setErrors}
            onGoToPassengers={() => setCurrentStep(3)}
          />
        )}
        {currentStep === 5 && (
          <Step4Confirmation
            data={tourData}
            onBackToFinancials={() => setCurrentStep(4)}
            errors={errors}
          />
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="wizard-actions" style={{ gap: '0.85rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button type="button" className="btn btn-secondary" onClick={handleBack} disabled={isSaving}>
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>
          {currentStep > 1 && onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRequestCancel}
              disabled={isSaving}
              style={{ color: 'var(--text-muted)' }}
            >
              Discard
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          {isEditingExisting && currentStep < 5 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSubmit}
              disabled={isSaving}
              style={{
                borderColor: 'var(--primary)',
                color: 'var(--primary)',
                fontWeight: '700'
              }}
            >
              {isSaving ? 'Saving...' : 'Quick Save Changes'}
            </button>
          )}

          {currentStep < 5 ? (
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              Next Step
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving
                ? 'Saving...'
                : isEditingExisting
                  ? 'Update Booking'
                  : 'Confirm & Save'}
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="Tinggalkan Formulir Tour?"
        message="Ada data formulir tour yang belum disimpan. Yakin ingin keluar? (Draft pengisian Anda tetap tersimpan di sesi browser)."
        confirmText="Ya, Tinggalkan"
        cancelText="Lanjut Mengisi"
        confirmVariant="warning"
        onConfirm={() => {
          setShowLeaveConfirm(false);
          if (onCancel) onCancel();
        }}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
};

export default TourWizard;
