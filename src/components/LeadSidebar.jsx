import React, { useState, useEffect } from 'react';
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
// Import all action button components
import Stage2ActionButton from './Stage2ActionButton';
import Stage3ActionButton from './Stage3ActionButton';
import Stage4ActionButton from './Stage4ActionButton';
import Stage5ActionButton from './Stage5ActionButton';
import Stage6ActionButton from './Stage6ActionButton';
import Stage7ActionButton from './Stage7ActionButton';
import Stage8ActionButton from './Stage8ActionButton';
import Stage9ActionButton from './Stage9ActionButton';

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
  onClose,
  onEditModeToggle,
  onFieldChange,
  onUpdateAllFields,
  onStageChange,
  getStageColor,
  getCounsellorInitials,
  getScoreFromStage,
  getCategoryFromStage
}) => {
  console.log('selectedLead data:', selectedLead);
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
      
      // Store original form data for comparison - UPDATED TO INCLUDE currentSchool
      setOriginalFormData({
        stage: selectedLead.stage,
        offer: selectedLead.offer || 'Welcome Kit',
        email: selectedLead.email || '',
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
  }, [selectedLead]);

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
      
      // Log the WhatsApp message action
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
      
      await logWhatsAppMessage(selectedLead.id, stageField, stageNames[stageField]);
      
      // Refresh history
      fetchHistory();
      
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
        .order('action_timestamp', { ascending: false });

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

  // UPDATED: Handle stage change without duplicate logging (parent handles logging)
  const handleStageChange = async (newStage) => {
    try {
      // Update the sidebar form data immediately for UI
      onFieldChange('stage', newStage);
      
      // Close dropdown
      setStageDropdownOpen(false);
      
      // Call the stage-specific update function if provided
      // (This will handle the logging to avoid duplication)
      if (onStageChange) {
        await onStageChange(selectedLead.id, newStage);
        
        // Refresh history
        fetchHistory();
      }
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Error updating stage: ' + error.message);
    }
  };

  // Enhanced update all fields function with summary logging to avoid duplication
  // Simplified update function - let parent handle the form data
// Update function with logging
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
      const changeDescription = generateChangeDescription(changes);
      await logAction(selectedLead.id, 'Lead Information Updated', `Updated via sidebar: ${changeDescription}`);
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

  // Add this new useEffect
  useEffect(() => {
    if (selectedLead?.id) {
      fetchHistory();
    }
  }, [selectedLead?.id]);

  if (!showSidebar) return null;

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
                  {sidebarFormData.email || 'Not provided'}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              {/* Stage */}
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
                    style={{ backgroundColor: getStageColor(sidebarFormData.stage || selectedLead?.stage) }}
                  >
                    <span>{sidebarFormData.stage || selectedLead?.stage}</span>
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
                      {stages.map((stage, index) => (
                        <div
                          key={stage.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStageChange(stage.value);
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
                          <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{stage.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Score */}
              {/*<div className="lead-sidebar-info-row">
                <label className="lead-sidebar-stage-label">
                  Score
                </label>
                <div className="lead-sidebar-score-badge">
                  {getScoreFromStage(sidebarFormData.stage || selectedLead?.stage)}
                </div>
              </div>*/}

              {/* Status */}
              <div className="lead-sidebar-info-row">
                <label className="lead-sidebar-stage-label">
                  Status
                </label>
                <div className="lead-sidebar-field-value">
                  {getCategoryFromStage(sidebarFormData.stage || selectedLead?.stage)}
                </div>
              </div>

              {/* Source */}
              <div className="lead-sidebar-info-row">
                <label className="lead-sidebar-stage-label">
                  Source
                </label>
                <div className="lead-sidebar-field-value">
                  {selectedLead?.source || 'Instagram'}
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
            <div className="lead-sidebar-tab-content">
              {/* Parent Info Section */}
              <div className="lead-sidebar-section">
                <div className="lead-sidebar-section-layout">
                  <div className="lead-sidebar-section-title-container">
                    <h6 className="lead-sidebar-section-title">
                      Parent Info
                    </h6>
                  </div>
                  <div className="lead-sidebar-section-content">
                    <div className="lead-sidebar-form-row">
                      <label className="lead-sidebar-form-label">Phone</label>
                      {!isEditingMode ? (
                        <div className="lead-sidebar-field-value">
                          {selectedLead?.phone || 'Not provided'}
                        </div>
                      ) : (
                        <input 
                          type="text" 
                          value={selectedLead?.phone || ''} 
                          readOnly
                          className="lead-sidebar-form-input"
                        />
                      )}
                    </div>

                    <div className="lead-sidebar-form-row">
                      <label className="lead-sidebar-form-label">Email</label>
                      {!isEditingMode ? (
                        <div className="lead-sidebar-field-value">
                          {sidebarFormData.email || ''}
                        </div>
                      ) : (
                        <input 
                          type="email" 
                          value={sidebarFormData.email} 
                          onChange={(e) => onFieldChange('email', e.target.value)}
                          placeholder="Enter email"
                          className="lead-sidebar-form-input"
                        />
                      )}
                    </div>

                    <div className="lead-sidebar-form-row">
                      <label className="lead-sidebar-form-label">Occupation</label>
                      {!isEditingMode ? (
                        <div className="lead-sidebar-field-value">
                            {(sidebarFormData.occupation === 'NULL' || !sidebarFormData.occupation) ? '' : sidebarFormData.occupation}
                        </div>
                      ) : (
                        <input 
                          type="text" 
                          value={sidebarFormData.occupation} 
                          onChange={(e) => onFieldChange('occupation', e.target.value)}
                          placeholder="Enter occupation"
                          className="lead-sidebar-form-input"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Child Info Section */}
              <div className="lead-sidebar-section">
                <div className="lead-sidebar-section-layout">
                  <div className="lead-sidebar-section-title-container">
                    <h6 className="lead-sidebar-section-title">
                      Child Info
                    </h6>
                  </div>
                  <div className="lead-sidebar-section-content">
                    <div className="lead-sidebar-form-row">
                      <label className="lead-sidebar-form-label">Location</label>
                      {!isEditingMode ? (
                        <div className="lead-sidebar-field-value">
                          {sidebarFormData.location || ''}
                        </div>
                      ) : (
                        <input 
                          type="text" 
                          value={sidebarFormData.location} 
                          onChange={(e) => onFieldChange('location', e.target.value)}
                          placeholder="Enter location"
                          className="lead-sidebar-form-input"
                        />
                      )}
                    </div>

                    {/* UPDATED: Current School field now properly connected */}
                    <div className="lead-sidebar-form-row">
                      <label className="lead-sidebar-form-label">Current School</label>
                      {!isEditingMode ? (
                        <div className="lead-sidebar-field-value">
                        {(sidebarFormData.currentSchool === 'NULL' || !sidebarFormData.currentSchool) ? '' : sidebarFormData.currentSchool}
                        </div>
                      ) : (
                        <input 
                          type="text" 
                          value={sidebarFormData.currentSchool || ''}
                          onChange={(e) => onFieldChange('currentSchool', e.target.value)}
                          placeholder="Enter current school"
                          className="lead-sidebar-form-input"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Meeting Details Section */}
              <div className="lead-sidebar-section">
                <div className="lead-sidebar-section-layout">
                  <div className="lead-sidebar-section-title-container">
                    <h6 className="lead-sidebar-section-title">
                      Meeting Details
                    </h6>
                  </div>
                  <div className="lead-sidebar-section-content">
                    <div className="lead-sidebar-form-row">
                      <label className="lead-sidebar-form-label">Meeting Date</label>
                      {!isEditingMode ? (
                        <div className="lead-sidebar-field-value">
                          {sidebarFormData.meetingDate || ''}
                        </div>
                      ) : (
                        <input 
                          type="date" 
                          value={sidebarFormData.meetingDate} 
                          onChange={(e) => onFieldChange('meetingDate', e.target.value)}
                          className="lead-sidebar-form-input"
                        />
                      )}
                    </div>

                    <div className="lead-sidebar-form-row">
                      <label className="lead-sidebar-form-label">Meeting Time</label>
                      {!isEditingMode ? (
                        <div className="lead-sidebar-field-value">
                          {sidebarFormData.meetingTime || ''}
                        </div>
                      ) : (
                        <input 
                          type="time" 
                          value={sidebarFormData.meetingTime} 
                          onChange={(e) => onFieldChange('meetingTime', e.target.value)}
                          className="lead-sidebar-form-input"
                        />
                      )}
                    </div>


                    <div className="lead-sidebar-form-row">
                      <label className="lead-sidebar-form-label">Meeting Link</label>
                      {!isEditingMode ? (
                            <div className="lead-sidebar-field-value">
                              {(sidebarFormData.meetingLink === 'NULL' || !sidebarFormData.meetingLink) ? '' : (
                                  <a 
                                    href={sidebarFormData.meetingLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: '#007bff', textDecoration: 'underline' }}
                                  >
                                    {sidebarFormData.meetingLink}
                                  </a>
                                )}
                            </div>
                          ) : (

                        <input 
                          type="text" 
                          value={sidebarFormData.meetingLink} 
                          onChange={(e) => onFieldChange('meetingLink', e.target.value)}
                          placeholder="Enter meeting link"
                          className="lead-sidebar-form-input"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visit Details Section */}
              <div className="lead-sidebar-section">
                <div className="lead-sidebar-section-layout">
                  <div className="lead-sidebar-section-title-container">
                    <h6 className="lead-sidebar-section-title">
                      Visit Details
                    </h6>
                  </div>
                  <div className="lead-sidebar-section-content">
                    <div className="lead-sidebar-form-row">
                      <label className="lead-sidebar-form-label">Visit Date</label>
                      {!isEditingMode ? (
                        <div className="lead-sidebar-field-value">
                          {sidebarFormData.visitDate || ''}
                        </div>
                      ) : (
                        <input 
                          type="date" 
                          value={sidebarFormData.visitDate} 
                          onChange={(e) => onFieldChange('visitDate', e.target.value)}
                          className="lead-sidebar-form-input"
                        />
                      )}
                    </div>

                    <div className="lead-sidebar-form-row">
                      <label className="lead-sidebar-form-label">Visit Time</label>
                      {!isEditingMode ? (
                        <div className="lead-sidebar-field-value">
                          {sidebarFormData.visitTime || ''}
                        </div>
                      ) : (
                        <input 
                          type="time" 
                          value={sidebarFormData.visitTime} 
                          onChange={(e) => onFieldChange('visitTime', e.target.value)}
                          className="lead-sidebar-form-input"
                        />
                      )}
                    </div>

                    <div className="lead-sidebar-form-row">
                      <label className="lead-sidebar-form-label">Visit Location</label>
                      {!isEditingMode ? (
                        <div className="lead-sidebar-field-value">
                          {(sidebarFormData.visitLocation === 'NULL' || !sidebarFormData.visitLocation) ? '' : sidebarFormData.visitLocation}
                        </div>
                      ) : (
                        <input 
                          type="text" 
                          value={sidebarFormData.visitLocation} 
                          onChange={(e) => onFieldChange('visitLocation', e.target.value)}
                          placeholder="Enter visit location"
                          className="lead-sidebar-form-input"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admission Details Section */}
              <div className="lead-sidebar-section">
                <div className="lead-sidebar-section-layout">
                  <div className="lead-sidebar-section-title-container">
                    <h6 className="lead-sidebar-section-title">
                      Admission Details
                    </h6>
                  </div>
                  <div className="lead-sidebar-section-content">
                    <div className="lead-sidebar-form-row">
                      <label className="lead-sidebar-form-label">Registration Fees</label>
                      {!isEditingMode ? (
                        <div className={`lead-sidebar-status-badge ${sidebarFormData.registrationFees === 'Paid' ? 'paid' : 'unpaid'}`}>
                          {(sidebarFormData.registrationFees === 'NULL' || !sidebarFormData.registrationFees) ? '' : sidebarFormData.registrationFees}
                        </div>
                      ) : (
                        <select
                          value={sidebarFormData.registrationFees}
                          onChange={(e) => onFieldChange('registrationFees', e.target.value)}
                          className="lead-sidebar-form-select"
                        >
                          <option value="">Select status</option>
                          <option value="Paid">Paid</option>
                          <option value="Not Paid">Not Paid</option>
                        </select>
                      )}
                    </div>

                    <div className="lead-sidebar-form-row">
                      <label className="lead-sidebar-form-label">Enrolled</label>
                      {!isEditingMode ? (
                        <div className={`lead-sidebar-status-badge ${sidebarFormData.enrolled === 'Yes' ? 'paid' : 'unpaid'}`}>
                            {(sidebarFormData.enrolled === 'NULL' || !sidebarFormData.enrolled) ? '' : sidebarFormData.enrolled}

                        </div>
                      ) : (
                        <select
                          value={sidebarFormData.enrolled}
                          onChange={(e) => onFieldChange('enrolled', e.target.value)}
                          className="lead-sidebar-form-select"
                        >
                          <option value="">Select status</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

              {/* Stage 3: Meeting Booked */}
              {/*<div className="lead-sidebar-action-row">
                <div className="lead-sidebar-action-stage">Stage 3 Meeting Booked</div>
                <div>
                  <Stage3ActionButton
                    leadId={selectedLead?.id}
                    currentStatus={stageStatuses.stage3_status}
                    onStatusUpdate={handleStatusUpdate}
                    alwaysVisible={true}
                  />
                </div>
                <div>
                  {stageStatuses.stage3_status === 'SENT' && (
                    <span className="lead-sidebar-action-status">SENT</span>
                  )}
                </div>
              </div>*/}

              {/* Stage 4: Meeting Done */}
              <div className="lead-sidebar-action-row">
                <div className="lead-sidebar-action-stage">Stage 4 Meeting Done</div>
                <div>
                  <Stage4ActionButton
                  leadId={selectedLead?.id}
                  currentStatus={stageStatuses.stage4_status}
                  onStatusUpdate={handleStatusUpdate}
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

              {/* Stage 6: Visit Booked */}
             {/* <div className="lead-sidebar-action-row">
                <div className="lead-sidebar-action-stage">Stage 6 Visit Booked</div>
                <div>
                  <Stage6ActionButton
                    leadId={selectedLead?.id}
                    currentStatus={stageStatuses.stage6_status}
                    onStatusUpdate={handleStatusUpdate}
                    alwaysVisible={true}
                  />
                </div>
                <div>
                  {stageStatuses.stage6_status === 'SENT' && (
                    <span className="lead-sidebar-action-status">SENT</span>
                  )}
                </div>
              </div>*/}

              {/* Stage 7: Visit Done */}
              <div className="lead-sidebar-action-row">
                <div className="lead-sidebar-action-stage">Stage 7 Visit Done</div>
                <div>
                  <Stage7ActionButton
                    leadId={selectedLead?.id}
                    currentStatus={stageStatuses.stage7_status}
                    onStatusUpdate={handleStatusUpdate}
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