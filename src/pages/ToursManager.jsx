import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import TourWizard from '../components/tours/TourWizard';
import DatabaseTable from '../components/tours/DatabaseTable';
import TourSummary from '../components/tours/TourSummary';
import TourReporting from '../components/tours/TourReporting';

const ToursManager = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('summary'); // 'wizard', 'database', 'summary'
  const [editingTour, setEditingTour] = useState(null);

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
            <div className="section-title">
              Tours Management
            </div>
          
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
