import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import TourWizard from '../components/tours/TourWizard';
import DatabaseTable from '../components/tours/DatabaseTable';
import TourSummary from '../components/tours/TourSummary';
import TourReporting from '../components/tours/TourReporting';
import CsvImportUtility from '../components/CsvImportUtility';
import { useTours } from '../context/TourContext';
import { UploadCloud } from 'lucide-react';

const ToursManager = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('summary'); // 'wizard', 'database', 'summary', 'reporting'
  const [editingTour, setEditingTour] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const { bulkImportTours } = useTours();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebarOnMobile = () => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleEditTour = (tour) => {
    setEditingTour(tour);
    setActiveTab('wizard');
  };

  const handleImportData = async (data) => {
    try {
      // Map flat CSV data to Tour format
      const mappedData = data.map(row => ({
        tourCode: row['Tour Code'] || '',
        bookingCode: row['Booking Code'] || '',
        country: row['Country'] || 'Unknown',
        category: row['Category'] || 'Leisure',
        departureDate: row['Departure Date'] || '',
        returnDate: row['Return Date'] || '',
        paxCount: parseInt(row['Pax Count']) || 1,
        status: row['Status'] || 'Pending',
        staffName: row['Staff Name'] || ''
      }));
      
      await bulkImportTours(mappedData);
      alert(`Successfully imported ${mappedData.length} records!`);
      setShowImport(false);
      setActiveTab('database');
    } catch (err) {
      alert('Failed to import data: ' + err.message);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'wizard':
        return (
          <TourWizard 
            initialData={editingTour} 
            onComplete={() => {
              setActiveTab('database');
              setEditingTour(null);
            }} 
            onCancel={() => {
              setActiveTab('database');
              setEditingTour(null);
            }}
          />
        );
      case 'database':
        return <DatabaseTable onEdit={handleEditTour} />;
      case 'summary':
        return <TourSummary />;
      case 'reporting':
        return <TourReporting />;
      default:
        return <DatabaseTable onEdit={handleEditTour} />;
    }
  };

  return (
    <div className="app-container fade-in">
      <div 
        className={`overlay ${isSidebarOpen ? '' : 'hidden'}`} 
        onClick={closeSidebarOnMobile}
      ></div>
      
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeSidebarOnMobile} />
      
      <div className="main-content">
        <TopNav toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <div className="page-container">
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Tours Management</span>
              <button 
                onClick={() => setShowImport(!showImport)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)',
                  border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.5rem 1rem',
                  borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem'
                }}
              >
                <UploadCloud size={16} /> Import Bulk Data
              </button>
            </div>
            
            {showImport && (
              <CsvImportUtility 
                onImport={handleImportData}
                templateHeaders={['Tour Code', 'Booking Code', 'Country', 'Category', 'Departure Date', 'Return Date', 'Pax Count', 'Status', 'Staff Name']}
              />
            )}
          
          <div className="tabs-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)' }}>
            <button 
              className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => { setActiveTab('summary'); setEditingTour(null); }}
            >
              Summary Dashboard
            </button>
            <button 
              className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
              onClick={() => { setActiveTab('database'); setEditingTour(null); }}
            >
              Database
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reporting' ? 'active' : ''}`}
              onClick={() => { setActiveTab('reporting'); setEditingTour(null); }}
            >
              Reporting Data
            </button>
            <button 
              className={`tab-btn ${activeTab === 'wizard' ? 'active' : ''}`}
              onClick={() => setActiveTab('wizard')}
            >
              {editingTour ? 'Edit Booking Form' : 'Add Booking Form'}
            </button>
          </div>

          <div className="tab-content">
            {renderContent()}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToursManager;
