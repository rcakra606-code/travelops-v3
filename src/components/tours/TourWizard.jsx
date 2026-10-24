import React, { useState, useEffect } from 'react';
import Step1TourInfo from './steps/Step1TourInfo';
import Step2PaxInfo from './steps/Step2PaxInfo';
import Step3Financials from './steps/Step3Financials';
import Step4Confirmation from './steps/Step4Confirmation';
import { useTours } from '../../context/TourContext';
import { useAuth } from '../../context/AuthContext';
import { Check } from 'lucide-react';

const initialTourState = {
  tourCode: '',
  bookingCode: '',
  departureDate: '',
  returnDate: '',
  country: '',
  paxCount: 1,
  staffName: '',
  status: 'Pending',
  claimMdr: false,
  claimMdrAt: null,
  claimMdrBy: '',
  paxInfo: [],
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

const STEPS = [
  { id: 1, title: 'Tour Info' },
  { id: 2, title: 'Passengers' },
  { id: 3, title: 'Financials' },
  { id: 4, title: 'Confirm' }
];

const TourWizard = ({ initialData, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [tourData, setTourData] = useState(initialTourState);
  const { addTour, updateTour } = useTours();
  const { user } = useAuth();

  useEffect(() => {
    if (initialData) {
      const fin = initialData.financials || {};
      const basicTourPrice = Number(fin.basicTourPrice !== undefined ? fin.basicTourPrice : (fin.totalSales || 0));
      const discountSupplier = Number(fin.discountSupplier !== undefined ? fin.discountSupplier : (fin.discount || 0));
      const discountBranch = Number(fin.discountBranch !== undefined ? fin.discountBranch : 0);
      const profit = Number(fin.profit || 0);
      const totalSellingPrice = Number(fin.totalSellingPrice !== undefined ? fin.totalSellingPrice : (fin.totalOmset || (basicTourPrice - discountSupplier - discountBranch)));
      const totalNettPrice = Number(fin.totalNettPrice !== undefined ? fin.totalNettPrice : (fin.cost || (basicTourPrice - discountSupplier - profit)));
      const depositAmount = Number(fin.depositAmount || 0);
      const sisaPelunasan = totalSellingPrice - depositAmount;

      // Map paxInfo backwards-compatibility
      const mappedPaxInfo = Array.isArray(initialData.paxInfo)
        ? initialData.paxInfo.map(p => ({
            ...p,
            basicPrice: p.basicPrice !== undefined ? p.basicPrice : (p.sellingPrice || ''),
            sellingPrice: p.sellingPrice !== undefined ? p.sellingPrice : (p.basicPrice || ''),
            discountSupplier: p.discountSupplier !== undefined ? p.discountSupplier : (p.discount || ''),
            discountBranch: p.discountBranch !== undefined ? p.discountBranch : ''
          }))
        : [];

      const claimMdr = Boolean(initialData.claimMdr !== undefined ? initialData.claimMdr : initialData.internals?.claimMdr);
      const claimMdrAt = initialData.claimMdrAt || initialData.internals?.claimMdrAt || null;
      const claimMdrBy = initialData.claimMdrBy || initialData.internals?.claimMdrBy || '';

      setTourData({
        ...initialData,
        paxInfo: mappedPaxInfo,
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
          sisaPelunasan
        }
      });
    }
  }, [initialData]);

  const [errors, setErrors] = useState({});

  const updateTourData = (newData) => {
    setTourData(prev => ({ ...prev, ...newData }));
    // If financials or depositNumber is updated, clear errors if present
    if (newData.financials?.depositNumber?.trim()) {
      setErrors(prev => ({ ...prev, depositNumber: null }));
    }
  };

  const validateStep3 = () => {
    const depositNumber = tourData.financials?.depositNumber ? String(tourData.financials.depositNumber).trim() : '';
    if (!depositNumber) {
      setErrors(prev => ({ ...prev, depositNumber: 'Nomor DP (Deposit Number) wajib diisi untuk disimpan ke database.' }));
      return false;
    }
    setErrors(prev => ({ ...prev, depositNumber: null }));
    return true;
  };

  const handleNext = () => {
    if (currentStep === 3) {
      if (!validateStep3()) {
        alert('⚠️ Perhatian: Nomor DP wajib diisi sebelum melanjutkan ke tahap konfirmasi!');
        return;
      }
    }
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) {
      setCurrentStep(3);
      alert('⚠️ Perhatian: Nomor DP wajib terinput pada database! Silakan lengkapi Nomor DP di Step Financials.');
      return;
    }

    try {
      const dataToSave = { 
        ...tourData, 
        updatedBy: user?.name || 'System',
        userRole: user?.role
      };
      if (initialData && initialData.id) {
        await updateTour(initialData.id, dataToSave);
      } else {
        await addTour(dataToSave);
      }
      onComplete();
    } catch (err) {
      alert('Gagal menyimpan booking: ' + err.message);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1TourInfo data={tourData} updateData={updateTourData} />;
      case 2:
        return <Step2PaxInfo data={tourData} updateData={updateTourData} />;
      case 3:
        return <Step3Financials data={tourData} updateData={updateTourData} errors={errors} setErrors={setErrors} />;
      case 4:
        return <Step4Confirmation data={tourData} onBackToFinancials={() => setCurrentStep(3)} errors={errors} />;
      default:
        return <Step1TourInfo data={tourData} updateData={updateTourData} />;
    }
  };

  return (
    <div className="card wizard-container fade-in">
      
      {/* DESKTOP STEPPER */}
      <div className="wizard-steps desktop-only">
        {STEPS.map(step => (
          <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 1 }}>
            <div 
              className={`step-indicator ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
              title={`Step ${step.id}: ${step.title}`}
            >
              {currentStep > step.id ? <Check size={16} /> : step.id}
            </div>
            <span style={{ 
              fontSize: '0.75rem', fontWeight: '500', 
              color: currentStep >= step.id ? 'var(--text-main)' : 'var(--text-muted)' 
            }}>
              {step.title}
            </span>
          </div>
        ))}
      </div>

      {/* MOBILE STEPPER */}
      <div className="mobile-only" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-dark)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>Step {currentStep} of {STEPS.length}</span>
          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)' }}>{STEPS[currentStep - 1].title}</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${(currentStep / STEPS.length) * 100}%`, 
            background: 'linear-gradient(90deg, var(--primary), #60a5fa)',
            transition: 'width 0.3s ease-in-out'
          }} />
        </div>
      </div>
      
      <div className="wizard-content">
        {renderStep()}
      </div>

      <div className="wizard-actions" style={{ flexDirection: window.innerWidth <= 768 ? 'column-reverse' : 'row', gap: '1rem' }}>
        <button className="btn" onClick={handleBack} style={{ background: 'rgba(255,255,255,0.1)', width: window.innerWidth <= 768 ? '100%' : 'auto' }}>
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </button>
        
        {currentStep < 4 ? (
          <button className="btn btn-primary" onClick={handleNext} style={{ width: window.innerWidth <= 768 ? '100%' : 'auto' }}>
            Next Step
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleSubmit} style={{ width: window.innerWidth <= 768 ? '100%' : 'auto' }}>
            {initialData ? 'Update Booking' : 'Confirm & Save'}
          </button>
        )}
      </div>
    </div>
  );
};

export default TourWizard;
