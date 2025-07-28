import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettingsData } from '../contexts/SettingsDataProvider';
import { supabase } from '../lib/supabase';
import { 
  logAction,
  logMeetingScheduled,
  logVisitScheduled,
  logWhatsAppMessage,
  logManualEntry,
  generateChangeDescription
} from '../utils/historyLogger';
import { 
  Clipboard,
  History,
  FileText,
  Edit,
  ChevronDown
} from 'lucide-react';
import LeadStateProvider,{ useLeadState } from './LeadStateProvider';
// Import all action button components
import Stage2ActionButton from './Stage2ActionButton';
import Stage3ActionButton from './Stage3ActionButton';
import Stage4ActionButton from './Stage4ActionButton';
import Stage5ActionButton from './Stage5ActionButton';
import Stage6ActionButton from './Stage6ActionButton';
import Stage7ActionButton from './Stage7ActionButton';
import Stage8ActionButton from './Stage8ActionButton';
import Stage9ActionButton from './Stage9ActionButton';
// Import the new InfoTab component
import InfoTab from './InfoTab';

// Add debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Helper to check if date is today
const isToday = (dateString) => {
  const today = new Date();
  const date = new Date(dateString);
  return date.toDateString() === today.toDateString();
};

const LeadSidebar = ({
  showSidebar,
  selectedLead,
  isEditingMode,
  sidebarFormData,
  stages,
  settingsData,
  onClose,
  onEditModeToggle,
  onFieldChange,
  onUpdateAllFields,
  onStageChange,
  onRefreshActivityData,
  getStageColor,
  getCounsellorInitials,
  getScoreFromStage,
  getCategoryFromStage
}) => {  
  console.log('selectedLead data:', selectedLead);
  
  // Use the context hook for action status updates
  const { updateActionStatus } = useLeadState();
  
  // ← NEW: Use settings context for stage functions
  const { 
    getFieldLabel, 
    getStageInfo, 
    getStageColor: contextGetStageColor, 
    getStageCategory: contextGetStageCategory,
    getStageKeyFromName,
    getStageNameFromKey,
    stageMappings,
    stageKeyToDataMapping
  } = useSettingsData();

  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [stageStatuses, setStageStatuses] = useState({
    stage2_status: '',
    stage3_status: '',
    stage4_status: '',
    stage5_status: '',
    stage6_status: '',
    stage7_status: '',
    stage8_status: '',
    stage9_status: ''
  });

  const [historyData, setHistoryData] = useState([]);
  const [manualAction, setManualAction] = useState('');
  const [manualDetails, setManualDetails] = useState('');
  
  // Store original values for comparison
  const [originalFormData, setOriginalFormData] = useState({});

  // ← NEW: Convert stage names to stage_keys for leads
  const getLeadStageKey = (leadStageValue) => {
    // If the lead already has a stage_key, return it
    if (stageKeyToDataMapping[leadStageValue]) {
      return leadStageValue;
    }
    
    // Otherwise, try to convert stage name to stage_key
    const stageKey = getStageKeyFromName(leadStageValue);
    return stageKey || leadStageValue; // fallback to original value
  };

  // ← NEW: Get stage display name for UI
  const getLeadStageDisplayName = (leadStageValue) => {
    // If it's a stage_key, get the display name
    if (stageKeyToDataMapping[leadStageValue]) {
      return getStageNameFromKey(leadStageValue);
    }
    
    // Otherwise, it's probably already a stage name
    return leadStageValue;
  };

  // ← UPDATED: Use context stage functions with stage_key support
  const getStageColorForLead = (stageValue) => {
    const stageKey = getLeadStageKey(stageValue);
    return contextGetStageColor(stageKey) || getStageColor?.(stageValue) || '#B3D7FF';
  };

  const getStageCategoryForLead = (stageValue) => {
    const stageKey = getLeadStageKey(stageValue);
    return contextGetStageCategory(stageKey) || getCategoryFromStage?.(stageValue) || 'New';
  };

  // Update statuses when selectedLead changes
  useEffect(() => {
    if (selectedLead) {
      setStageStatuses({
        stage2_status: selectedLead.stage2_status || '',
        stage3_status: selectedLead.stage3_status || '',
        stage4_status: selectedLead.stage4_status || '',
        stage5_status: selectedLead.stage5_status || '',
        stage6_status: selectedLead.stage6_status || '',
        stage7_status: selectedLead.stage7_status || '',
        stage8_status: selectedLead.stage8_status || '',
        stage9_status: selectedLead.stage9_status || ''
      });
      
      // Store original form data for comparison - UPDATED TO INCLUDE ALL NEW FIELDS
      setOriginalFormData({
        parentsName: selectedLead.parentsName || '',
        kidsName: selectedLead.kidsName || '',
        grade: selectedLead.grade || '',
        source: selectedLead.source || (settingsData?.sources?.[0]?.name || 'Instagram'),
        stage: selectedLead.stage,
        counsellor: selectedLead.counsellor || '', 
        offer: selectedLead.offer || 'Welcome Kit',
        email: selectedLead.email || '',
        phone: selectedLead.phone || '',
        occupation: selectedLead.occupation || '',
        location: selectedLead.location || '',
        currentSchool: selectedLead.currentSchool || '',
        meetingDate: selectedLead.meetingDate || '',
        meetingTime: selectedLead.meetingTime || '',
        meetingLink: selectedLead.meetingLink || '',
        visitDate: selectedLead.visitDate || '',
        visitTime: selectedLead.visitTime || '',
        visitLocation: selectedLead.visitLocation || '',
        registrationFees: selectedLead.registrationFees || '',
        enrolled: selectedLead.enrolled || ''
      });
    }
  }, [selectedLead, settingsData]);

  // Handle status updates from action buttons
  const handleStatusUpdate = async (stageField, newStatus) => {
    setStageStatuses(prev => ({
      ...prev,
      [stageField]: newStatus
    }));

    try {
      const { data, error } = await supabase
        .from('Leads')
        .update({ [stageField]: newStatus })
        .eq('id', selectedLead.id);

      if (error) throw error;
      
      // Use context instead of callback:
      updateActionStatus(selectedLead.id, stageField, newStatus);
      
      // Log the WhatsApp message action in background
      const stageNames = {
        'stage2_status': 'Stage 2 - Connected',
        'stage3_status': 'Stage 3 - Meeting Booked',
        'stage4_status': 'Stage 4 - Meeting Done',
        'stage5_status': 'Stage 5 - Proposal Sent',
        'stage6_status': 'Stage 6 - Visit Booked',
        'stage7_status': 'Stage 7 - Visit Done',
        'stage8_status': 'Stage 8 - Registered',
        'stage9_status': 'Stage 9 - Enrolled'
      };
      
      // Don't wait for logging - do it in background
      logWhatsAppMessage(selectedLead.id, stageField, stageNames[stageField]);
      
      // Only refresh history if user is viewing history tab
      if (activeTab === 'history') {
        fetchHistory();
      }
      
    } catch (error) {
      setStageStatuses(prev => ({
        ...prev,
        [stageField]: ''
      }));
      alert(`Failed to update status: ${error.message}`);
    }
  };

  // New History
  const fetchHistory = async () => {
    if (!selectedLead?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('record_id', selectedLead.id.toString())
        .order('action_timestamp', { ascending: false })
        .limit(50); // Only get recent 50 entries

      if (error) throw error;
      setHistoryData(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleManualHistoryUpdate = async () => {
    if (!manualAction.trim() || !manualDetails.trim()) {
      alert('Please fill in both Action Type and Details');
      return;
    }

    try {
      await logManualEntry(selectedLead.id, manualAction, manualDetails);
      setManualAction('');
      setManualDetails('');
      fetchHistory();
    } catch (error) {
      alert('Failed to add history entry');
    }
  };

  // ← UPDATED: Handle stage change with stage_key support
  const handleStageChange = async (newStageValue) => {
    try {
      console.log('=== STAGE CHANGE ===');
      console.log('New stage value:', newStageValue);
      
      // Check if this is a stage name or stage_key
      let stageKeyToStore, stageNameToDisplay;
      
      if (stageKeyToDataMapping[newStageValue]) {
        // It's a stage_key
        stageKeyToStore = newStageValue;
        stageNameToDisplay = getStageNameFromKey(newStageValue);
      } else {
        // It's a stage name, convert to stage_key
        stageKeyToStore = getStageKeyFromName(newStageValue);
        stageNameToDisplay = newStageValue;
      }
      
      console.log('Stage key to store:', stageKeyToStore);
      console.log('Stage name to display:', stageNameToDisplay);
      
      // Update the sidebar form data with stage_key for internal consistency
      // but use stage name for display compatibility
      onFieldChange('stage', stageKeyToStore || newStageValue);
      
      // Close dropdown
      setStageDropdownOpen(false);
      
      // Call the stage-specific update function if provided
      if (onStageChange) {
        await onStageChange(selectedLead.id, stageKeyToStore || newStageValue);
        
        // Refresh history
        if (activeTab === 'history') {
          fetchHistory();
        }
      }
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Error updating stage: ' + error.message);
    }
  };

  // UPDATED: Update function with logging and enhanced field support
  const handleUpdateAllFields = async () => {
    try {
      // Track all changes before calling parent update
      const changes = {};
      
      // Compare each field and track changes
      Object.keys(sidebarFormData).forEach(field => {
        const oldValue = originalFormData[field];
        const newValue = sidebarFormData[field];
        
        if (oldValue !== newValue) {
          changes[field] = {
            oldValue,
            newValue
          };
        }
      });

      // Call the parent's update function
      await onUpdateAllFields();
      
      // Log changes if any exist
      if (Object.keys(changes).length > 0) {
        // Log meeting scheduling if both date and time are present
        if (changes.meetingDate || changes.meetingTime) {
          const meetingDate = sidebarFormData.meetingDate;
          const meetingTime = sidebarFormData.meetingTime;
          
          if (meetingDate && meetingTime) {
            await logMeetingScheduled(
              selectedLead.id,
              meetingDate,
              meetingTime,
              sidebarFormData.meetingLink
            );
          }
        }
        
        // Log visit scheduling if both date and time are present
        if (changes.visitDate || changes.visitTime) {
          const visitDate = sidebarFormData.visitDate;
          const visitTime = sidebarFormData.visitTime;
          
          if (visitDate && visitTime) {
            await logVisitScheduled(
              selectedLead.id,
              visitDate,
              visitTime,
              sidebarFormData.visitLocation
            );
          }
        }
        
        // Log a general update summary for all changes
        const changeDescription = generateChangeDescription(changes,getFieldLabel);
        await logAction(selectedLead.id, 'Lead Information Updated', `Updated via sidebar: ${changeDescription}`);
        
        // ADDED: Refresh activity data after logging
        if (onRefreshActivityData) {
          await onRefreshActivityData();
        }
      }
      
      // Refresh history
      fetchHistory();
      
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Error updating lead: ' + error.message);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (stageDropdownOpen) {
        setStageDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [stageDropdownOpen]);

  // Only fetch history when History tab is active
  useEffect(() => {
    if (selectedLead?.id && activeTab === 'history') {
      fetchHistory();
    }
  }, [selectedLead?.id, activeTab]);

  // Refresh history when lead data changes (for updates from AddLeadForm)
  useEffect(() => {
    if (selectedLead?.id && activeTab === 'history') {
      // Small delay to ensure database changes are committed
      setTimeout(() => {
        fetchHistory();
      }, 500);
    }
  }, [selectedLead?.id, selectedLead?.stage, selectedLead?.phone, selectedLead?.email]);

  if (!showSidebar) return null;

  // ← NEW: Get current stage info for display
  const currentStageKey = getLeadStageKey(sidebarFormData.stage || selectedLead?.stage);
  const currentStageDisplayName = getLeadStageDisplayName(sidebarFormData.stage || selectedLead?.stage);

  return (
    <>
      <div className="lead-sidebar-overlay" onClick={onClose}></div>
      <div className="lead-sidebar" style={{display: 'block'}}>
        {/* Header with Parent Name */}
        <div className="lead-sidebar-header">
          <h5 className="lead-sidebar-title">
            {selectedLead?.parentsName}
          </h5>
          <button onClick={onClose} className="lead-sidebar-close-btn">
            ×
          </button>
        </div>
        
        {/* Created Date */}
        <div className="lead-sidebar-created-date">
          Created {selectedLead?.createdTime}
        </div>
        
        {/* Light Border */}
        <div className="lead-sidebar-divider"></div>
        
        <div className="lead-sidebar-content">
          {/* Two Column Layout */}
          <div className="lead-sidebar-two-column">
            {/* Left Column */}
            <div className="lead-sidebar-left-column">
              {/* Kid Name */}
              <div className="lead-sidebar-field">
                <label className="lead-sidebar-field-label">
                  Kid Name
                </label>
                <div className="lead-sidebar-field-value">
                  {selectedLead?.kidsName}
                </div>
              </div>

              {/* Class */}
              <div className="lead-sidebar-field">
                <label className="lead-sidebar-field-label">
                  Class
                </label>
                <div className="lead-sidebar-field-value">
                  {selectedLead?.grade}
                </div>
              </div>

              {/* Phone */}
              <div className="lead-sidebar-field">
                <label className="lead-sidebar-field-label">
                  Phone
                </label>
                <div className="lead-sidebar-field-value">
                  {selectedLead?.phone}
                </div>
              </div>

              {/* Email */}
              <div className="lead-sidebar-field">
                <label className="lead-sidebar-field-label">
                  Email
                </label>
                <div className="lead-sidebar-field-value">
                  {sidebarFormData.email || ''}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              {/* ← UPDATED: Stage with stage_key support */}
              <div className="lead-sidebar-stage-container">
                <label className="lead-sidebar-stage-label">
                  Stage
                </label>
                <div className="lead-sidebar-stage-dropdown">
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setStageDropdownOpen(!stageDropdownOpen);
                    }}
                    className="lead-sidebar-stage-button"
                    style={{ backgroundColor: getStageColorForLead(currentStageKey) }}
                  >
                    <span>{currentStageDisplayName}</span>
                    <ChevronDown 
                      size={12} 
                      style={{ 
                        transform: stageDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }} 
                    />
                  </div>
                  
                  {stageDropdownOpen && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="lead-sidebar-stage-dropdown-menu"
                    >
                      {stages.map((stage, index) => {
                        // ← NEW: Handle both stage name and stage_key
                        const stageKey = getStageKeyFromName(stage.value) || stage.value;
                        const stageName = stage.label;
                        
                        return (
                          <div
                            key={stage.value}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStageChange(stageKey); // Pass stage_key instead of stage name
                            }}
                            className="lead-sidebar-stage-item"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f8f9fa';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                            }}
                          >
                            <span 
                              className="lead-sidebar-stage-dot"
                              style={{ backgroundColor: stage.color }}
                            ></span>
                            <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{stageName}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ← UPDATED: Status with stage_key support */}
              <div className="lead-sidebar-info-row">
                <label className="lead-sidebar-stage-label">
                  Status
                </label>
                <div className="lead-sidebar-field-value">
                  {getStageCategoryForLead(currentStageKey)}
                </div>
              </div>

              {/* Source */}
              <div className="lead-sidebar-info-row">
                <label className="lead-sidebar-stage-label">
                  Source
                </label>
                <div className="lead-sidebar-field-value">
                  {selectedLead?.source || (settingsData?.sources?.[0]?.name || 'Instagram')}
                </div>
              </div>

              {/* Counsellor */}
              <div className="lead-sidebar-counsellor-container">
                <label className="lead-sidebar-stage-label">
                  Counsellor
                </label>
                <div className="lead-sidebar-counsellor-info">
                  <div className="lead-sidebar-counsellor-avatar">
                    {getCounsellorInitials(selectedLead?.counsellor)}
                  </div>
                  <span className="lead-sidebar-counsellor-name">
                    {selectedLead?.counsellor}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="lead-sidebar-tabs">
            <div className="lead-sidebar-tabs-container">
              <button 
                onClick={() => setActiveTab('info')}
                className={`lead-sidebar-tab-button ${activeTab === 'info' ? 'active' : ''}`}
              >
                <Clipboard size={16} /> Info
              </button>
              <button 
                onClick={() => setActiveTab('action')}
                className={`lead-sidebar-tab-button ${activeTab === 'action' ? 'active' : ''}`}
              >
                <History size={16} /> Action
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`lead-sidebar-tab-button ${activeTab === 'history' ? 'active' : ''}`}
              >
                <FileText size={16} /> History
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'info' && (
            <InfoTab
              selectedLead={selectedLead}
              isEditingMode={isEditingMode}
              sidebarFormData={sidebarFormData}
              onFieldChange={onFieldChange}
              settingsData={settingsData}
              getFieldLabel={getFieldLabel}
            />
          )}

          {/* Action Tab Content */}
          {activeTab === 'action' && (
            <div className="lead-sidebar-tab-content">
              {/* Header Row */}
              <div className="lead-sidebar-action-header">
                <div>Stage Name</div>
                <div>Action</div>
                <div>Status</div>
              </div>

              {/* Stage Rows */}
              {/* Stage 2: Connected */}
              <div className="lead-sidebar-action-row">
                <div className="lead-sidebar-action-stage">Stage 2 Connected</div>
                <div>
                  <Stage2ActionButton
                    leadId={selectedLead?.id}
                    currentStatus={stageStatuses.stage2_status}
                    onStatusUpdate={handleStatusUpdate}
                    getFieldLabel={getFieldLabel}
                    alwaysVisible={true}
                    parentsName={selectedLead?.parentsName}
                    meetingDate={sidebarFormData.meetingDate}
                    meetingTime={sidebarFormData.meetingTime}
                    meetingLink={sidebarFormData.meetingLink}
                    phone={selectedLead?.phone}
                />
                </div>
                <div>
                  {stageStatuses.stage2_status === 'SENT' && (
                    <span className="lead-sidebar-action-status">SENT</span>
                  )}
                </div>
              </div>

              {/* Stage 4: Meeting Done */}
              <div className="lead-sidebar-action-row">
                <div className="lead-sidebar-action-stage">Stage 4 Meeting Done</div>
                <div>
                  <Stage4ActionButton
                  leadId={selectedLead?.id}
                  currentStatus={stageStatuses.stage4_status}
                  onStatusUpdate={handleStatusUpdate}
                  getFieldLabel={getFieldLabel}
                  alwaysVisible={true}
                  parentsName={selectedLead?.parentsName}
                  phone={selectedLead?.phone}
                />
                </div>
                <div>
                  {stageStatuses.stage4_status === 'SENT' && (
                    <span className="lead-sidebar-action-status">SENT</span>
                  )}
                </div>
              </div>

              {/* Stage 5: Proposal Sent */}
              <div className="lead-sidebar-action-row">
                <div className="lead-sidebar-action-stage">Stage 5 Proposal Sent</div>
                <div>
                  <Stage5ActionButton
                    leadId={selectedLead?.id}
                    currentStatus={stageStatuses.stage5_status}
                    onStatusUpdate={handleStatusUpdate}
                    getFieldLabel={getFieldLabel}  
                    alwaysVisible={true}
                    parentsName={selectedLead?.parentsName}
                    visitDate={sidebarFormData.visitDate}
                    visitTime={sidebarFormData.visitTime}
                    phone={selectedLead?.phone}
                  />
                </div>
                <div>
                  {stageStatuses.stage5_status === 'SENT' && (
                    <span className="lead-sidebar-action-status">SENT</span>
                  )}
                </div>
              </div>

              {/* Stage 7: Visit Done */}
              <div className="lead-sidebar-action-row">
                <div className="lead-sidebar-action-stage">Stage 7 Visit Done</div>
                <div>
                  <Stage7ActionButton
                    leadId={selectedLead?.id}
                    currentStatus={stageStatuses.stage7_status}
                    onStatusUpdate={handleStatusUpdate}
                     getFieldLabel={getFieldLabel}
                    alwaysVisible={true}
                    parentsName={selectedLead?.parentsName}
                    visitDate={sidebarFormData.visitDate}
                    phone={selectedLead?.phone}
                  />
                </div>
                <div>
                  {stageStatuses.stage7_status === 'SENT' && (
                    <span className="lead-sidebar-action-status">SENT</span>
                  )}
                </div>
              </div>

              {/* Stage 8: Registered */}
              <div className="lead-sidebar-action-row">
                <div className="lead-sidebar-action-stage">Stage 8 Registered</div>
                <div>
                  <Stage8ActionButton
                    leadId={selectedLead?.id}
                    currentStatus={stageStatuses.stage8_status}
                    onStatusUpdate={handleStatusUpdate}
                    getFieldLabel={getFieldLabel}  
                    alwaysVisible={true}
                    phone={selectedLead?.phone}
                  />
                </div>
                <div>
                  {stageStatuses.stage8_status === 'SENT' && (
                    <span className="lead-sidebar-action-status">SENT</span>
                  )}
                </div>
              </div>

              {/* Stage 9: Enrolled */}
              <div className="lead-sidebar-action-row">
                <div className="lead-sidebar-action-stage">Stage 9 Enrolled</div>
                <div>
                  <Stage9ActionButton
                    leadId={selectedLead?.id}
                    currentStatus={stageStatuses.stage9_status}
                    onStatusUpdate={handleStatusUpdate}
                    getFieldLabel={getFieldLabel}
                    alwaysVisible={true}
                    kidsName={selectedLead?.kidsName}
                    phone={selectedLead?.phone}
                  />
                </div>
                <div>
                  {stageStatuses.stage9_status === 'SENT' && (
                    <span className="lead-sidebar-action-status">SENT</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History Tab Content */}
          {activeTab === 'history' && (
            <div className="lead-sidebar-tab-content">
              {/* Manual History Input */}
              <div className="lead-sidebar-history-input">
                <h6 className="lead-sidebar-history-input-title">
                  Enter your recent activity with the lead here:
                </h6>
                <div className="lead-sidebar-history-input-form">
                  <div className="lead-sidebar-history-input-group">
                    <label className="lead-sidebar-history-input-label">
                      Action Type
                    </label>
                    <input
                      type="text"
                      value={manualAction}
                      onChange={(e) => setManualAction(e.target.value)}
                      placeholder="e.g., Call"
                      className="lead-sidebar-history-input-field"
                    />
                  </div>
                  <div className="lead-sidebar-history-input-group wide">
                    <label className="lead-sidebar-history-input-label">
                      Details
                    </label>
                    <input
                      type="text"
                      value={manualDetails}
                      onChange={(e) => setManualDetails(e.target.value)}
                      placeholder="e.g., They will visit the school on 14 Jul at 5pm"
                      className="lead-sidebar-history-input-field"
                    />
                  </div>
                  <button
                    onClick={handleManualHistoryUpdate}
                    className="lead-sidebar-history-update-btn"
                  >
                    Update
                  </button>
                </div>
              </div>

              {/* History Timeline */}
              <div className="lead-sidebar-history-timeline">
                {historyData.length > 0 ? (
                  historyData.map((entry, index) => (
                    <div key={entry.id} className="lead-sidebar-history-item">
                      {index < historyData.length - 1 && (
                        <div className="lead-sidebar-history-line"></div>
                      )}
                      
                      <div className={`lead-sidebar-history-dot ${isToday(entry.action_timestamp) ? 'today' : 'past'}`}></div>
                      
                      <div className="lead-sidebar-history-content">
                        <div className={`lead-sidebar-history-action ${isToday(entry.action_timestamp) ? 'today' : 'past'}`}>
                          {entry.main_action}
                        </div>
                        <div className="lead-sidebar-history-description">
                          {entry.description}
                        </div>
                        <div className="lead-sidebar-history-time">
                          {new Date(entry.action_timestamp).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="lead-sidebar-history-empty">
                    No history available
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Edit/Update Button - Only show for Info tab */}
          {activeTab === 'info' && (
            <div className="lead-sidebar-update-section">
              {!isEditingMode ? (
                <button 
                  onClick={onEditModeToggle}
                  className="lead-sidebar-update-button"
                >
                  <Edit size={16} /> Update
                </button>
              ) : (
                <div className="lead-sidebar-update-buttons">
                  <button 
                    onClick={handleUpdateAllFields}
                    className="primary"
                  >
                    Update
                  </button>
                  <button 
                    onClick={onEditModeToggle}
                    className="secondary"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LeadSidebar;