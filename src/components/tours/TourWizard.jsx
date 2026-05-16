import React, { useState, useEffect } from 'react';
import Step1TourInfo from './steps/Step1TourInfo';
import Step2PaxInfo from './steps/Step2PaxInfo';
import Step3Financials from './steps/Step3Financials';
import Step4Confirmation from './steps/Step4Confirmation';
import { useTours } from '../../context/TourContext';
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
  paxInfo: [],
  financials: {
    totalSales: 0,
    discount: 0,
    profit: 0,
    totalOmset: 0,
    cost: 0,
    depositNumber: '',
    invoiceNumber: '',
    discountLink: ''
  }
};

const TourWizard = ({ initialData, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [tourData, setTourData] = useState(initialTourState);
  const { addTour, updateTour } = useTours();

  useEffect(() => {
    if (initialData) {
      setTourData(initialData);
    }
  }, [initialData]);

  const updateTourData = (newData) => {
    setTourData(prev => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    // Add validation logic if needed
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

  const handleSubmit = () => {
    if (initialData && initialData.id) {
      updateTour(initialData.id, tourData);
    } else {
      addTour(tourData);
    }
    onComplete();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1TourInfo data={tourData} updateData={updateTourData} />;
      case 2:
        return <Step2PaxInfo data={tourData} updateData={updateTourData} />;
      case 3:
        return <Step3Financials data={tourData} updateData={updateTourData} />;
      case 4:
        return <Step4Confirmation data={tourData} />;
      default:
        return <Step1TourInfo data={tourData} updateData={updateTourData} />;
    }
  };

  return (
    <div className="card wizard-container">
      <div className="wizard-steps">
        {[1, 2, 3, 4].map(step => (
          <div 
            key={step} 
            className={`step-indicator ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
            title={`Step ${step}`}
          >
            {currentStep > step ? <Check size={16} /> : step}
          </div>
        ))}
      </div>
      
      <div className="wizard-content">
        {renderStep()}
      </div>

      <div className="wizard-actions">
        <button className="btn" onClick={handleBack} style={{ background: 'rgba(255,255,255,0.1)' }}>
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </button>
        
        {currentStep < 4 ? (
          <button className="btn btn-primary" onClick={handleNext}>
            Next Step
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleSubmit}>
            {initialData ? 'Update Booking' : 'Confirm & Save'}
          </button>
        )}
      </div>
    </div>
  );
};

export default TourWizard;
