// FilterDropdown.jsx - Reusable Component with Two-Level Dropdown
import React, { useState } from 'react';
import { X, Filter, ChevronDown, ChevronRight } from 'lucide-react';

const FilterDropdown = ({ 
  isOpen, 
  onClose, 
  counsellorFilters, 
  stageFilters, 
  statusFilters = [], // New status filter
  setCounsellorFilters, 
  setStageFilters, 
  setStatusFilters, // New status filter setter
  onClearAll 
}) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const counsellors = [
    'Assign Counsellor',
    'Sachin',
    'Rohit',
    'Mukhesh'
  ];

  const stages = [
    'New Lead',
    'Connected',
    'Meeting Booked',
    'Meeting Done', 
    'Proposal Sent',
    'Visit Booked',
    'Visit Done',
    'Registered',
    'Admission',
    'No Response'
  ];

  const statuses = [
    'New',
    'Warm', 
    'Hot',
    'Enrolled',
    'Cold'
  ];

  const handleCounsellorChange = (counsellor) => {
    if (counsellorFilters.includes(counsellor)) {
      setCounsellorFilters(counsellorFilters.filter(c => c !== counsellor));
    } else {
      setCounsellorFilters([...counsellorFilters, counsellor]);
    }
  };

  const handleStageChange = (stage) => {
    if (stageFilters.includes(stage)) {
      setStageFilters(stageFilters.filter(s => s !== stage));
    } else {
      setStageFilters([...stageFilters, stage]);
    }
  };

  const handleStatusChange = (status) => {
    if (statusFilters.includes(status)) {
      setStatusFilters(statusFilters.filter(s => s !== status));
    } else {
      setStatusFilters([...statusFilters, status]);
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getFilterCount = (type) => {
    switch(type) {
      case 'counsellor': return counsellorFilters.length;
      case 'stage': return stageFilters.length;
      case 'status': return statusFilters.length;
      default: return 0;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="filter-backdrop" 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999
        }}
      ></div>

      {/* Filter Dropdown */}
      <div 
        className="filter-dropdown"
        style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          width: '320px',
          maxHeight: '500px',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '16px', 
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h6 style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>Filter Leads</h6>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter Content */}
        <div style={{ padding: '16px' }}>
          
          {/* Counsellor Filter Section */}
          <div style={{ marginBottom: '12px' }}>
            <div 
              onClick={() => toggleSection('counsellor')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                padding: '8px 0',
                borderBottom: '1px solid #f3f4f6'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Counsellor</span>
                {getFilterCount('counsellor') > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {getFilterCount('counsellor')}
                  </span>
                )}
              </div>
              {expandedSection === 'counsellor' ? 
                <ChevronDown size={16} /> : 
                <ChevronRight size={16} />
              }
            </div>
            
            {expandedSection === 'counsellor' && (
              <div style={{ paddingTop: '12px' }}>
                {counsellors.map(counsellor => (
                  <label 
                    key={counsellor}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '8px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={counsellorFilters.includes(counsellor)}
                      onChange={() => handleCounsellorChange(counsellor)}
                      style={{ marginRight: '8px' }}
                    />
                    {counsellor}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Stage Filter Section */}
          <div style={{ marginBottom: '12px' }}>
            <div 
              onClick={() => toggleSection('stage')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                padding: '8px 0',
                borderBottom: '1px solid #f3f4f6'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Stage</span>
                {getFilterCount('stage') > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {getFilterCount('stage')}
                  </span>
                )}
              </div>
              {expandedSection === 'stage' ? 
                <ChevronDown size={16} /> : 
                <ChevronRight size={16} />
              }
            </div>
            
            {expandedSection === 'stage' && (
              <div style={{ paddingTop: '12px' }}>
                {stages.map(stage => (
                  <label 
                    key={stage}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '8px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={stageFilters.includes(stage)}
                      onChange={() => handleStageChange(stage)}
                      style={{ marginRight: '8px' }}
                    />
                    {stage}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter Section */}
          <div style={{ marginBottom: '20px' }}>
            <div 
              onClick={() => toggleSection('status')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                padding: '8px 0',
                borderBottom: '1px solid #f3f4f6'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Status</span>
                {getFilterCount('status') > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {getFilterCount('status')}
                  </span>
                )}
              </div>
              {expandedSection === 'status' ? 
                <ChevronDown size={16} /> : 
                <ChevronRight size={16} />
              }
            </div>
            
            {expandedSection === 'status' && (
              <div style={{ paddingTop: '12px' }}>
                {statuses.map(status => (
                  <label 
                    key={status}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '8px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={statusFilters.includes(status)}
                      onChange={() => handleStatusChange(status)}
                      style={{ marginRight: '8px' }}
                    />
                    {status}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Clear All Button */}
          <button
            onClick={onClearAll}
            style={{
              width: '100%',
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
            }}
          >
            Clear All Filters
          </button>

          {/* Active Filters Count */}
          {(counsellorFilters.length > 0 || stageFilters.length > 0 || statusFilters.length > 0) && (
            <div style={{ 
              marginTop: '12px', 
              fontSize: '12px', 
              color: '#6b7280',
              textAlign: 'center'
            }}>
              {counsellorFilters.length + stageFilters.length + statusFilters.length} filter(s) active
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Updated filter logic utility function
export const applyFilters = (leads, counsellorFilters, stageFilters, statusFilters = []) => {
  return leads.filter(lead => {
    // If no filters selected, show all leads
    if (counsellorFilters.length === 0 && stageFilters.length === 0 && statusFilters.length === 0) {
      return true;
    }

    // Check counsellor filter
    const counsellorMatch = counsellorFilters.length === 0 || 
                           counsellorFilters.includes(lead.counsellor);

    // Check stage filter  
    const stageMatch = stageFilters.length === 0 || 
                      stageFilters.includes(lead.stage);

    // Check status filter
    const statusMatch = statusFilters.length === 0 ||
                       statusFilters.includes(lead.category);

    // Lead must match all filters (AND logic)
    return counsellorMatch && stageMatch && statusMatch;
  });
};

// Updated FilterButton component
export const FilterButton = ({ 
  showFilter, 
  setShowFilter, 
  counsellorFilters, 
  stageFilters, 
  statusFilters = [],
  setCounsellorFilters, 
  setStageFilters,
  setStatusFilters
}) => (
  <div style={{ position: 'relative' }}>
    <button 
      className="filter-btn"
      onClick={() => setShowFilter(!showFilter)}
      style={{ position: 'relative' }}
    >
      <Filter size={16} />
      Filter
      {/* Active indicator */}
      {(counsellorFilters.length > 0 || stageFilters.length > 0 || statusFilters.length > 0) && (
        <span style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          width: '8px',
          height: '8px',
          backgroundColor: '#ef4444',
          borderRadius: '50%'
        }}></span>
      )}
    </button>

    <FilterDropdown
      isOpen={showFilter}
      onClose={() => setShowFilter(false)}
      counsellorFilters={counsellorFilters}
      stageFilters={stageFilters}
      statusFilters={statusFilters}
      setCounsellorFilters={setCounsellorFilters}
      setStageFilters={setStageFilters}
      setStatusFilters={setStatusFilters}
      onClearAll={() => {
        setCounsellorFilters([]);
        setStageFilters([]);
        setStatusFilters([]);
      }}
    />
  </div>
);

export default FilterDropdown;