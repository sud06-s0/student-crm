// FilterDropdown.jsx - Reusable Component
import React from 'react';
import { X, Filter } from 'lucide-react';

const FilterDropdown = ({ 
  isOpen, 
  onClose, 
  counsellorFilters, 
  stageFilters, 
  setCounsellorFilters, 
  setStageFilters, 
  onClearAll 
}) => {
  const counsellors = [
    'Assign Counsellor',
    'Sachin',
    'Rohit',
    'Mukhesh'
  ];

  const stages = [
    'New Lead',
    'Connected',
    'Call Booked',
    'Proposal Sent',
    'Visit Booked',
    'Visit Done',
    'Registered',
    'Full Fees Paid',
    'No Response'
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
          {/* Counsellor Filter */}
          <div style={{ marginBottom: '20px' }}>
            <h6 style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              textTransform: 'uppercase',
              color: '#6b7280',
              marginBottom: '12px'
            }}>
              Counsellor
            </h6>
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

          {/* Stage Filter */}
          <div style={{ marginBottom: '20px' }}>
            <h6 style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              textTransform: 'uppercase',
              color: '#6b7280',
              marginBottom: '12px'
            }}>
              Stage
            </h6>
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
          {(counsellorFilters.length > 0 || stageFilters.length > 0) && (
            <div style={{ 
              marginTop: '12px', 
              fontSize: '12px', 
              color: '#6b7280',
              textAlign: 'center'
            }}>
              {counsellorFilters.length + stageFilters.length} filter(s) active
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Filter logic utility function
export const applyFilters = (leads, counsellorFilters, stageFilters) => {
  return leads.filter(lead => {
    // If no filters selected, show all leads
    if (counsellorFilters.length === 0 && stageFilters.length === 0) {
      return true;
    }

    // Check counsellor filter
    const counsellorMatch = counsellorFilters.length === 0 || 
                           counsellorFilters.includes(lead.counsellor);

    // Check stage filter  
    const stageMatch = stageFilters.length === 0 || 
                      stageFilters.includes(lead.stage);

    // Lead must match both filters (AND logic)
    return counsellorMatch && stageMatch;
  });
};

// FilterButton component for easy integration
export const FilterButton = ({ 
  showFilter, 
  setShowFilter, 
  counsellorFilters, 
  stageFilters, 
  setCounsellorFilters, 
  setStageFilters 
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
      {(counsellorFilters.length > 0 || stageFilters.length > 0) && (
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
      setCounsellorFilters={setCounsellorFilters}
      setStageFilters={setStageFilters}
      onClearAll={() => {
        setCounsellorFilters([]);
        setStageFilters([]);
      }}
    />
  </div>
);

export default FilterDropdown;