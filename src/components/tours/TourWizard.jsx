import { useState } from 'react';
import { Check, MapPin, Calendar, Users } from 'lucide-react';
import Step1TourInfo from './steps/Step1TourInfo';
import Step2PaxInfo from './steps/Step2PaxInfo';
import Step3Financials from './steps/Step3Financials';
import Step4Confirmation from './steps/Step4Confirmation';
import { useTours } from '../../context/TourContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';
import {
  resizePaxList,
  hasPerPaxPricing,
  computeFinancialsFromPax,
  getTripDurationInfo,
  formatShortDate
} from '../../utils/tourHelpers';

const STEPS = [
  { id: 1, title: 'Tour Info' },
  { id: 2, title: 'Travelers' },
  { id: 3, title: 'Financials' },
  { id: 4, title: 'Confirm' }
];

const buildInitialWizardState = (initialData, prefillDate, defaultStaffName) => {
  if (initialData) {
    const fin = initialData.financials || {};
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
    const totalSellingPrice = Number(
      fin.totalSellingPrice !== undefined
        ? fin.totalSellingPrice
        : fin.totalOmset || basicTourPrice - discountSupplier - discountBranch
    );
    const totalNettPrice = Number(
      fin.totalNettPrice !== undefined
        ? fin.totalNettPrice
        : fin.cost || basicTourPrice - discountSupplier - profit
    );
    const depositAmount = Number(fin.depositAmount || 0);
    const sisaPelunasan = totalSellingPrice - depositAmount;
    const paxCount = Math.max(1, parseInt(initialData.paxCount, 10) || 1);

    const mappedPax = Array.isArray(initialData.paxInfo)
      ? initialData.paxInfo.map((p) => ({
          ...p,
          basicPrice: p.basicPrice !== undefined ? p.basicPrice : p.sellingPrice || '',
          sellingPrice: p.sellingPrice !== undefined ? p.sellingPrice : p.basicPrice || '',
          discountSupplier:
            p.discountSupplier !== undefined ? p.discountSupplier : p.discount || '',
          discountBranch: p.discountBranch !== undefined ? p.discountBranch : ''
        }))
      : [];

    const paxInfo = resizePaxList(mappedPax, paxCount);
    const claimMdr = Boolean(
      initialData.claimMdr !== undefined
        ? initialData.claimMdr
        : initialData.internals?.claimMdr
    );
    const claimMdrAt = initialData.claimMdrAt || initialData.internals?.claimMdrAt || null;
    const claimMdrBy = initialData.claimMdrBy || initialData.internals?.claimMdrBy || '';

    return {
      ...initialData,
      category: initialData.category || 'Leisure',
      paxCount,
      paxInfo,
      claimMdr,
      claimMdrAt,
      claimMdrBy,
      financials: {
        ...fin,
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
        depositNumber: fin.depositNumber || '',
        depositAmount,
        sisaPelunasan,
        invoiceNumber: fin.invoiceNumber || '',
        discountLink: fin.discountLink || ''
      }
    };
  }

  return {
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
    buildInitialWizardState(initialData, prefillDate, user?.name)
  );

  const clearError = (field) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
  };

  const updateTourData = (newData) => {
    setTourData((prev) => ({ ...prev, ...newData }));
    if (newData.financials?.depositNumber?.trim()) {
      clearError('depositNumber');
    }
  };

  const validateStep1 = () => {
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

    if (Object.keys(nextErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      toast.warning(
        nextErrors.dateOrder ||
          nextErrors.country ||
          nextErrors.departureDate ||
          'Please complete required tour details in Step 1.'
      );
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const depositNumber = tourData.financials?.depositNumber
      ? String(tourData.financials.depositNumber).trim()
      : '';
    if (!depositNumber) {
      setErrors((prev) => ({
        ...prev,
        depositNumber: 'Nomor DP (Deposit Number) is required before saving to the database.'
      }));
      toast.warning('Please enter Nomor DP (Deposit Number) in Step 3 Financials.');
      return false;
    }
    setErrors((prev) => ({ ...prev, depositNumber: null }));
    return true;
  };

  const syncFinancialsIfPerPax = () => {
    if (hasPerPaxPricing(tourData.paxInfo)) {
      setTourData((prev) => ({
        ...prev,
        financials: computeFinancialsFromPax(prev.paxInfo, prev.financials)
      }));
    }
  };

  const goToStep = (targetStep) => {
    if (targetStep === currentStep) return;

    if (targetStep > currentStep) {
      if (currentStep === 1 && !validateStep1()) return;
      if (targetStep === 4) {
        if (!validateStep1()) {
          setCurrentStep(1);
          return;
        }
        if (!validateStep3()) {
          setCurrentStep(3);
          return;
        }
      }
    }

    syncFinancialsIfPerPax();
    setCurrentStep(targetStep);
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep < 4) {
      syncFinancialsIfPerPax();
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep3()) {
      setCurrentStep(3);
      return;
    }

    setIsSaving(true);
    try {
      const syncedFinancials = hasPerPaxPricing(tourData.paxInfo)
        ? computeFinancialsFromPax(tourData.paxInfo, tourData.financials)
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
    ? computeFinancialsFromPax(tourData.paxInfo, tourData.financials)
    : tourData.financials || {};
  const liveOmset = Number(liveFinancials.totalSellingPrice || liveFinancials.totalOmset || 0);

  return (
    <div className="card wizard-container fade-in">
      {/* Live Context Pill Strip */}
      {(tourData.country || tourData.departureDate || liveOmset > 0) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.65rem',
            padding: '0.65rem 1rem',
            marginBottom: '1.35rem',
            borderRadius: '11px',
            background: isLight ? '#f4f9ff' : 'rgba(56, 189, 248, 0.05)',
            border: '1px solid var(--border)',
            fontSize: '0.79rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '800', color: 'var(--primary)' }}>
              {isEditingExisting
                ? `Editing: ${tourData.bookingCode || tourData.tourCode || initialData.id}`
                : initialData
                  ? 'Duplicated Draft'
                  : 'New Tour Draft'}
            </span>
            {tourData.country && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', color: 'var(--text-main)', fontWeight: '600' }}>
                <MapPin size={13} color="var(--primary)" /> {tourData.country}
              </span>
            )}
            {tourData.departureDate && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', color: 'var(--text-muted)' }}>
                <Calendar size={13} /> {formatShortDate(tourData.departureDate)}
                {tourData.returnDate ? ` → ${formatShortDate(tourData.returnDate)}` : ''}
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', color: 'var(--text-muted)' }}>
              <Users size={13} /> {tourData.paxCount} Pax
            </span>
          </div>

          {liveOmset > 0 && (
            <span className="font-mono" style={{ fontWeight: '800', color: 'var(--primary)' }}>
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

      {/* ACTIVE STEP CONTENT */}
      <div className="wizard-content">
        {currentStep === 1 && (
          <Step1TourInfo
            data={tourData}
            updateData={updateTourData}
            errors={errors}
            clearError={clearError}
          />
        )}
        {currentStep === 2 && (
          <Step2PaxInfo data={tourData} updateData={updateTourData} />
        )}
        {currentStep === 3 && (
          <Step3Financials
            data={tourData}
            updateData={updateTourData}
            errors={errors}
            setErrors={setErrors}
            onGoToPassengers={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 4 && (
          <Step4Confirmation
            data={tourData}
            onBackToFinancials={() => setCurrentStep(3)}
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
              onClick={onCancel}
              disabled={isSaving}
              style={{ color: 'var(--text-muted)' }}
            >
              Discard
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          {isEditingExisting && currentStep < 4 && (
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

          {currentStep < 4 ? (
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
    </div>
  );
};

export default TourWizard;
