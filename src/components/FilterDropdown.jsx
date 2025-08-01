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
  onClearAll,
  settingsData, // ← Receive settings data
  getFieldLabel, // ← NEW: Receive getFieldLabel function
  getStageKeyFromName, // ← NEW: Stage conversion function
  getStageDisplayName // ← NEW: Stage conversion function
}) => {
  const [expandedSection, setExpandedSection] = useState(null);

  // ← UPDATED: Get dynamic counsellors from settings
  const counsellors = settingsData?.counsellors?.map(counsellor => counsellor.name) || ['Assign Counsellor'];

  // ← UPDATED: Get dynamic stages from settings (display names for UI)
  const stages = settingsData?.stages?.map(stage => stage.name) || ['New Lead'];

  // ← UPDATED: Get dynamic statuses from settings (unique stage statuses)
  const statuses = [...new Set(settingsData?.stages?.map(stage => stage.status).filter(Boolean))] || ['New'];

  const handleCounsellorChange = (counsellor) => {
    if (counsellorFilters.includes(counsellor)) {
      setCounsellorFilters(counsellorFilters.filter(c => c !== counsellor));
    } else {
      setCounsellorFilters([...counsellorFilters, counsellor]);
    }
  };

  // ← UPDATED: Handle stage filtering with stage_key conversion
  const handleStageChange = (stageName) => {
    if (stageFilters.includes(stageName)) {
      setStageFilters(stageFilters.filter(s => s !== stageName));
    } else {
      setStageFilters([...stageFilters, stageName]);
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
          
          {/* ← UPDATED: Counsellor Filter Section with dynamic label */}
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
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  {getFieldLabel ? getFieldLabel('counsellor') : 'Counsellor'}
                </span>
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

          {/* ← UPDATED: Stage Filter Section with dynamic label */}
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
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  {getFieldLabel ? getFieldLabel('stage') : 'Stage'}
                </span>
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
                {stages.map(stageName => (
                  <label 
                    key={stageName}
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
                      checked={stageFilters.includes(stageName)}
                      onChange={() => handleStageChange(stageName)}
                      style={{ marginRight: '8px' }}
                    />
                    {stageName}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter Section (no changes needed - already good) */}
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

// ← UPDATED: Filter logic utility function with stage_key support
export const applyFilters = (leads, counsellorFilters, stageFilters, statusFilters = [], getStageDisplayName, getStageKeyFromName) => {
  return leads.filter(lead => {
    // If no filters selected, show all leads
    if (counsellorFilters.length === 0 && stageFilters.length === 0 && statusFilters.length === 0) {
      return true;
    }

    // ← UPDATED: Check counsellor filter (field_key aware)
    const counsellorMatch = counsellorFilters.length === 0 || 
                           counsellorFilters.includes(lead.counsellor);

    // ← UPDATED: Check stage filter with stage_key conversion
    let stageMatch = false;
    if (stageFilters.length === 0) {
      stageMatch = true;
    } else {
      // Lead stage could be stage_key or stage name, filters are stage names
      let leadStageName;
      
      if (getStageDisplayName) {
        // Try to get display name (in case lead.stage is stage_key)
        leadStageName = getStageDisplayName(lead.stage) || lead.stage;
      } else {
        // Fallback to direct comparison
        leadStageName = lead.stage;
      }
      
      stageMatch = stageFilters.includes(leadStageName);
      
      console.log('=== STAGE FILTER DEBUG ===');
      console.log('Lead stage value:', lead.stage);
      console.log('Lead stage display name:', leadStageName);
      console.log('Stage filters:', stageFilters);
      console.log('Stage match:', stageMatch);
    }

    // Check status filter
    const statusMatch = statusFilters.length === 0 ||
                       statusFilters.includes(lead.category);

    // Lead must match all filters (AND logic)
    return counsellorMatch && stageMatch && statusMatch;
  });
};

// ← UPDATED: FilterButton component with field_key and stage_key support
export const FilterButton = ({ 
  showFilter, 
  setShowFilter, 
  counsellorFilters, 
  stageFilters, 
  statusFilters = [],
  setCounsellorFilters, 
  setStageFilters,
  setStatusFilters,
  settingsData, // ← Receive settings data
  getFieldLabel, // ← NEW: Receive getFieldLabel function
  getStageKeyFromName, // ← NEW: Stage conversion function
  getStageDisplayName // ← NEW: Stage conversion function
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
      settingsData={settingsData}
      getFieldLabel={getFieldLabel} // ← NEW: Pass getFieldLabel
      getStageKeyFromName={getStageKeyFromName} // ← NEW: Pass stage conversion
      getStageDisplayName={getStageDisplayName} // ← NEW: Pass stage conversion
      onClearAll={() => {
        setCounsellorFilters([]);
        setStageFilters([]);
        setStatusFilters([]);
      }}
    />
  </div>
);

// Export FilterDropdown as both default and named export
export { FilterDropdown };
export default FilterDropdown;