import React, { useEffect, useState } from 'react';
import { settingsService } from '../services/settingsService';
import { supabase } from '../lib/supabase';
import { TABLE_NAMES } from '../config/tableNames';
import { CheckCircle, XCircle } from 'lucide-react';

const InfoTab = ({
  selectedLead,
  isEditingMode,
  sidebarFormData,
  onFieldChange,
  settingsData,
  getFieldLabel,
  customFieldsData = {},
  onCustomFieldChange,
  onRefreshLead // NEW: callback to refresh lead data
}) => {
  
  // States for meeting/visit confirmations
  const [showMeetingConfirmation, setShowMeetingConfirmation] = useState(false);
  const [showVisitConfirmation, setShowVisitConfirmation] = useState(false);
  const [meetingConfirmed, setMeetingConfirmed] = useState(false);
  const [visitConfirmed, setVisitConfirmed] = useState(false);
  
  // Early return if settings not loaded
  if (!settingsData) {
    console.log('settingsData not loaded yet');
    return <div className="lead-sidebar-tab-content">Loading settings...</div>;
  }

  // Get dynamic sources from settings
  const sources = settingsData?.sources?.map(source => source.name) || ['Instagram'];

  // Get dynamic grades from settings
  const grades = settingsData?.grades?.map(grade => grade.name) || ['LKG'];

  // Helper function to check if datetime has passed
  const hasDateTimePassed = (date, time) => {
    if (!date || !time) return false;
    
    const dateTimeString = `${date}T${time}:00`;
    const dateTime = new Date(dateTimeString);
    const now = new Date();
    
    return now > dateTime;
  };

  // Reset confirmation states when lead changes - DO THIS FIRST
  useEffect(() => {
    setMeetingConfirmed(false);
    setVisitConfirmed(false);
    setShowMeetingConfirmation(false);
    setShowVisitConfirmation(false);
  }, [selectedLead?.id]);

  // Check if meeting/visit confirmations should be shown - ONLY when sidebar first opens
  useEffect(() => {
    if (!selectedLead || isEditingMode) return;
    
    console.log('=== CONFIRMATION CHECK ===');
    console.log('Selected Lead:', selectedLead);
    console.log('Meeting Date:', selectedLead.meetingDate);
    console.log('Meeting Time:', selectedLead.meetingTime);
    console.log('Visit Date:', selectedLead.visitDate);
    console.log('Visit Time:', selectedLead.visitTime);
    console.log('Form Meeting Date:', sidebarFormData.meetingDate);
    console.log('Form Meeting Time:', sidebarFormData.meetingTime);
    
    // Check meeting - use sidebarFormData which has the actual values
    const meetingDate = sidebarFormData.meetingDate || selectedLead.meetingDate;
    const meetingTime = sidebarFormData.meetingTime || selectedLead.meetingTime;
    
    const hasMeetingPassed = hasDateTimePassed(meetingDate, meetingTime);
    
    console.log('Meeting Date to check:', meetingDate);
    console.log('Meeting Time to check:', meetingTime);
    console.log('Has meeting passed?', hasMeetingPassed);
    
    if (hasMeetingPassed && !meetingConfirmed) {
      console.log('Showing meeting confirmation');
      setShowMeetingConfirmation(true);
    }
    
    // Check visit - use sidebarFormData which has the actual values
    const visitDate = sidebarFormData.visitDate || selectedLead.visitDate;
    const visitTime = sidebarFormData.visitTime || selectedLead.visitTime;
    
    const hasVisitPassed = hasDateTimePassed(visitDate, visitTime);
    
    console.log('Visit Date to check:', visitDate);
    console.log('Visit Time to check:', visitTime);
    console.log('Has visit passed?', hasVisitPassed);
    
    if (hasVisitPassed && !visitConfirmed) {
      console.log('Showing visit confirmation');
      setShowVisitConfirmation(true);
    }
  }, [selectedLead?.id, sidebarFormData.meetingDate, sidebarFormData.meetingTime, sidebarFormData.visitDate, sidebarFormData.visitTime, meetingConfirmed, visitConfirmed, isEditingMode]);

  // Handle meeting confirmation
  const handleMeetingConfirmation = async (didHappen) => {
    if (didHappen) {
      // Just close the confirmation
      setShowMeetingConfirmation(false);
      setMeetingConfirmed(true);
    } else {
      // Clear meeting data and Stage 4 status
      try {
        const { error } = await supabase
          .from(TABLE_NAMES.LEADS)
          .update({
            meet_datetime: null,
            meet_link: null,
            stage4_status: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedLead.id);

        if (error) throw error;

        // Update local form data
        onFieldChange('meetingDate', '');
        onFieldChange('meetingTime', '');
        onFieldChange('meetingLink', '');
        
        setShowMeetingConfirmation(false);
        setMeetingConfirmed(true);
        
        // Refresh the lead data if callback provided
        if (onRefreshLead) {
          await onRefreshLead();
        }
        
        alert('Meeting details cleared successfully');
      } catch (error) {
        console.error('Error clearing meeting data:', error);
        alert('Error clearing meeting data: ' + error.message);
      }
    }
  };

  // Handle visit confirmation
  const handleVisitConfirmation = async (didHappen) => {
    if (didHappen) {
      // Just close the confirmation
      setShowVisitConfirmation(false);
      setVisitConfirmed(true);
    } else {
      // Clear visit data and Stage 7 status
      try {
        const { error } = await supabase
          .from(TABLE_NAMES.LEADS)
          .update({
            visit_datetime: null,
            visit_location: null,
            stage7_status: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedLead.id);

        if (error) throw error;

        // Update local form data
        onFieldChange('visitDate', '');
        onFieldChange('visitTime', '');
        onFieldChange('visitLocation', '');
        
        setShowVisitConfirmation(false);
        setVisitConfirmed(true);
        
        // Refresh the lead data if callback provided
        if (onRefreshLead) {
          await onRefreshLead();
        }
        
        alert('Visit details cleared successfully');
      } catch (error) {
        console.error('Error clearing visit data:', error);
        alert('Error clearing visit data: ' + error.message);
      }
    }
  };

  // Helper function to identify built-in fields
  function isBuiltInField(fieldName) {
    const builtInFields = [
      'Parents Name', 'Kids Name', 'Phone', 'Email', 'Location', 
      'Occupation', 'Current School', 'Offer', 'Notes', 'Meeting Date', 
      'Meeting Time', 'Meeting Link', 'Visit Date', 'Visit Time', 
      'Visit Location', 'Registration Fees', 'Enrolled', 'Parent Name',
      'Kid Name', 'Class', 'Grade', 'Source', 'Stage', 'Counsellor',
      'Secondary Phone', 'Second Phone'
    ];
    
    const normalizedFieldName = fieldName.toLowerCase().trim();
    const normalizedBuiltInFields = builtInFields.map(f => f.toLowerCase().trim());
    
    return normalizedBuiltInFields.includes(normalizedFieldName);
  }

  // Check different possible property names for form fields
  const formFields = settingsData?.form_fields || 
                    settingsData?.formFields || 
                    settingsData?.custom_fields || 
                    settingsData?.customFields || 
                    settingsData?.fields || 
                    [];

  // Enhanced custom fields filtering
  const customFields = formFields?.filter(field => {
    const isCustomField = field.is_custom === true;
    return isCustomField && field.is_active;
  }) || [];

  // Improved field key generation
  const getConsistentFieldKey = (field) => {
    if (field.field_key) {
      return field.field_key;
    }
    
    if (field.is_custom && field.id) {
      return `custom_field_${field.id}`;
    }
    
    return field.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  };

  // Data migration for custom fields
  const migrateCustomFieldData = (customFields, currentCustomFieldsData) => {
    const migratedData = { ...currentCustomFieldsData };
    
    customFields.forEach(field => {
      const newKey = getConsistentFieldKey(field);
      const oldKey = field.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      if (oldKey !== newKey && currentCustomFieldsData[oldKey] && !currentCustomFieldsData[newKey]) {
        migratedData[newKey] = currentCustomFieldsData[oldKey];
        delete migratedData[oldKey];
        
        console.log(`Migrated custom field data: ${oldKey} → ${newKey}`);
        
        if (onCustomFieldChange) {
          onCustomFieldChange(newKey, currentCustomFieldsData[oldKey]);
        }
      }
    });
    
    return migratedData;
  };

  // Add migration call
  useEffect(() => {
    if (customFields.length > 0 && Object.keys(customFieldsData).length > 0) {
      const migratedData = migrateCustomFieldData(customFields, customFieldsData);
      
      if (JSON.stringify(migratedData) !== JSON.stringify(customFieldsData)) {
        console.log('Custom field data migration completed');
      }
    }
  }, [customFields, customFieldsData]);

  // Helper function to render custom field input
  const renderCustomFieldInput = (field) => {
    const fieldKey = getConsistentFieldKey(field);
    const fieldValue = customFieldsData[fieldKey] || '';

    if (!isEditingMode) {
      if (field.field_type === 'Dropdown' && field.dropdown_options) {
        return (
          <div className="lead-sidebar-field-value">
            {fieldValue || ''}
          </div>
        );
      } else {
        return (
          <div className="lead-sidebar-field-value">
            {fieldValue || ''}
          </div>
        );
      }
    } else {
      if (field.field_type === 'Dropdown' && field.dropdown_options) {
        return (
          <select
            value={fieldValue}
            onChange={(e) => onCustomFieldChange(fieldKey, e.target.value)}
            className="lead-sidebar-form-select"
          >
            <option value="">Select {field.name}</option>
            {field.dropdown_options.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      } else if (field.field_type === 'Numeric') {
        return (
          <input 
            type="number" 
            value={fieldValue} 
            onChange={(e) => onCustomFieldChange(fieldKey, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}`}
            className="lead-sidebar-form-input"
          />
        );
      } else {
        return (
          <input 
            type="text" 
            value={fieldValue} 
            onChange={(e) => onCustomFieldChange(fieldKey, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}`}
            className="lead-sidebar-form-input"
          />
        );
      }
    }
  };

  // Helper function to format phone for display
  const formatPhoneForDisplay = (phoneNumber) => {
    if (!phoneNumber) return '';
    return phoneNumber.replace(/^\+91/, '');
  };

  // Helper function to handle phone input changes
  const handlePhoneChange = (fieldName, value) => {
    const digits = value.replace(/\D/g, '');
    const limitedDigits = digits.slice(0, 10);
    onFieldChange(fieldName, limitedDigits);
  };

  return (
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
            {/* Parent Name */}
            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">Parent Name</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {selectedLead?.parentsName || ''}
                </div>
              ) : (
                <input 
                  type="text" 
                  value={sidebarFormData.parentsName || selectedLead?.parentsName || ''} 
                  onChange={(e) => onFieldChange('parentsName', e.target.value)}
                  placeholder="Enter parent name"
                  className="lead-sidebar-form-input"
                />
              )}
            </div>

            {/* Primary Phone */}
            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">Phone</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {selectedLead?.phone || ''}
                </div>
              ) : (
                <div className="input-group">
                  <span className="input-group-text" style={{ 
                    backgroundColor: '#f8f9fa', 
                    border: '1px solid #dee2e6',
                    borderRight: 'none',
                    padding: '8px 12px',
                    fontSize: '14px'
                  }}>
                    +91
                  </span>
                  <input 
                    type="text" 
                    value={formatPhoneForDisplay(sidebarFormData.phone || selectedLead?.phone || '')} 
                    onChange={(e) => handlePhoneChange('phone', e.target.value)}
                    placeholder="Enter 10-digit number"
                    maxLength="10"
                    className="lead-sidebar-form-input"
                    style={{ borderLeft: 'none' }}
                  />
                </div>
              )}
            </div>

            {/* Secondary Phone */}
            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">{getFieldLabel('secondPhone')}</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {selectedLead?.secondPhone || sidebarFormData.secondPhone || ''}
                </div>
              ) : (
                <div className="input-group">
                  <span className="input-group-text" style={{ 
                    backgroundColor: '#f8f9fa', 
                    border: '1px solid #dee2e6',
                    borderRight: 'none',
                    padding: '8px 12px',
                    fontSize: '14px'
                  }}>
                    +91
                  </span>
                  <input 
                    type="text" 
                    value={formatPhoneForDisplay(sidebarFormData.secondPhone || selectedLead?.secondPhone || '')} 
                    onChange={(e) => handlePhoneChange('secondPhone', e.target.value)}
                    placeholder={`Enter 10-digit ${getFieldLabel('secondPhone').toLowerCase()} (optional)`}
                    maxLength="10"
                    className="lead-sidebar-form-input"
                    style={{ borderLeft: 'none' }}
                  />
                </div>
              )}
            </div>

            {/* Email */}
            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">Email</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {sidebarFormData.email || ''}
                </div>
              ) : (
                <input 
                  type="email" 
                  value={sidebarFormData.email || ''} 
                  onChange={(e) => onFieldChange('email', e.target.value)}
                  placeholder="Enter email"
                  className="lead-sidebar-form-input"
                />
              )}
            </div>

            {/* Occupation */}
            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">{getFieldLabel('occupation')}</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {(sidebarFormData.occupation === 'NULL' || !sidebarFormData.occupation) ? '' : sidebarFormData.occupation}
                </div>
              ) : (
                <input 
                  type="text" 
                  value={sidebarFormData.occupation || ''} 
                  onChange={(e) => onFieldChange('occupation', e.target.value)}
                  placeholder={`Enter ${getFieldLabel('occupation').toLowerCase()}`}
                  className="lead-sidebar-form-input"
                />
              )}
            </div>

            {/* Source */}
            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">Source</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {selectedLead?.source || sources[0] || 'Instagram'}
                </div>
              ) : (
                <select
                  value={sidebarFormData.source || selectedLead?.source || sources[0] || 'Instagram'}
                  onChange={(e) => onFieldChange('source', e.target.value)}
                  className="lead-sidebar-form-select"
                >
                  {sources.map(source => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
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
            {/* Kids Name */}
            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">Kid Name</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {selectedLead?.kidsName || ''}
                </div>
              ) : (
                <input 
                  type="text" 
                  value={sidebarFormData.kidsName || selectedLead?.kidsName || ''} 
                  onChange={(e) => onFieldChange('kidsName', e.target.value)}
                  placeholder="Enter kid name"
                  className="lead-sidebar-form-input"
                />
              )}
            </div>

            {/* Class/Grade */}
            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">Class</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {selectedLead?.grade || ''}
                </div>
              ) : (
                <select
                  value={sidebarFormData.grade || selectedLead?.grade || grades[0] || 'LKG'}
                  onChange={(e) => onFieldChange('grade', e.target.value)}
                  className="lead-sidebar-form-select"
                >
                  {grades.map(grade => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Location */}
            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">{getFieldLabel('location')}</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {sidebarFormData.location || ''}
                </div>
              ) : (
                <input 
                  type="text" 
                  value={sidebarFormData.location || ''} 
                  onChange={(e) => onFieldChange('location', e.target.value)}
                  placeholder={`Enter ${getFieldLabel('location').toLowerCase()}`}
                  className="lead-sidebar-form-input"
                />
              )}
            </div>

            {/* Current School */}
            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">{getFieldLabel('currentSchool')}</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {(sidebarFormData.currentSchool === 'NULL' || !sidebarFormData.currentSchool) ? '' : sidebarFormData.currentSchool}
                </div>
              ) : (
                <input 
                  type="text" 
                  value={sidebarFormData.currentSchool || ''}
                  onChange={(e) => onFieldChange('currentSchool', e.target.value)}
                  placeholder={`Enter ${getFieldLabel('currentSchool').toLowerCase()}`}
                  className="lead-sidebar-form-input"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Details Section with Confirmation */}
      <div className="lead-sidebar-section">
        <div className="lead-sidebar-section-layout">
          <div className="lead-sidebar-section-title-container">
            <h6 className="lead-sidebar-section-title">
              Meeting Details
            </h6>
          </div>
          
          {/* Meeting Confirmation Dialog */}
          {showMeetingConfirmation && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                marginBottom: '12px',
                color: '#856404'
              }}>
                Did the call happen?
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleMeetingConfirmation(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <CheckCircle size={16} /> Yes
                </button>
                <button
                  onClick={() => handleMeetingConfirmation(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <XCircle size={16} /> No
                </button>
              </div>
            </div>
          )}
          
          <div className="lead-sidebar-section-content">
            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">{getFieldLabel('meetingDate')}</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {sidebarFormData.meetingDate || ''}
                </div>
              ) : (
                <input 
                  type="date" 
                  value={sidebarFormData.meetingDate || ''} 
                  onChange={(e) => onFieldChange('meetingDate', e.target.value)}
                  className="lead-sidebar-form-input"
                />
              )}
            </div>

            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">{getFieldLabel('meetingTime')}</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {sidebarFormData.meetingTime || ''}
                </div>
              ) : (
                <input 
                  type="time" 
                  value={sidebarFormData.meetingTime || ''} 
                  onChange={(e) => onFieldChange('meetingTime', e.target.value)}
                  className="lead-sidebar-form-input"
                />
              )}
            </div>

            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">{getFieldLabel('meetingLink')}</label>
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
                  value={sidebarFormData.meetingLink || ''} 
                  onChange={(e) => onFieldChange('meetingLink', e.target.value)}
                  placeholder={`Enter ${getFieldLabel('meetingLink').toLowerCase()}`}
                  className="lead-sidebar-form-input"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visit Details Section with Confirmation */}
      <div className="lead-sidebar-section">
        <div className="lead-sidebar-section-layout">
          <div className="lead-sidebar-section-title-container">
            <h6 className="lead-sidebar-section-title">
              Visit Details
            </h6>
          </div>
          
          {/* Visit Confirmation Dialog */}
          {showVisitConfirmation && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                marginBottom: '12px',
                color: '#856404'
              }}>
                Did they visit the school?
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleVisitConfirmation(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <CheckCircle size={16} /> Yes
                </button>
                <button
                  onClick={() => handleVisitConfirmation(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <XCircle size={16} /> No
                </button>
              </div>
            </div>
          )}
          
          <div className="lead-sidebar-section-content">
            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">{getFieldLabel('visitDate')}</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {sidebarFormData.visitDate || ''}
                </div>
              ) : (
                <input 
                  type="date" 
                  value={sidebarFormData.visitDate || ''} 
                  onChange={(e) => onFieldChange('visitDate', e.target.value)}
                  className="lead-sidebar-form-input"
                />
              )}
            </div>

            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">{getFieldLabel('visitTime')}</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {sidebarFormData.visitTime || ''}
                </div>
              ) : (
                <input 
                  type="time" 
                  value={sidebarFormData.visitTime || ''} 
                  onChange={(e) => onFieldChange('visitTime', e.target.value)}
                  className="lead-sidebar-form-input"
                />
              )}
            </div>

            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">{getFieldLabel('visitLocation')}</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {(sidebarFormData.visitLocation === 'NULL' || !sidebarFormData.visitLocation) ? '' : sidebarFormData.visitLocation}
                </div>
              ) : (
                <input 
                  type="text" 
                  value={sidebarFormData.visitLocation || ''} 
                  onChange={(e) => onFieldChange('visitLocation', e.target.value)}
                  placeholder={`Enter ${getFieldLabel('visitLocation').toLowerCase()}`}
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
              <label className="lead-sidebar-form-label">{getFieldLabel('registrationFees')}</label>
              {!isEditingMode ? (
                <div className={`lead-sidebar-status-badge ${sidebarFormData.registrationFees === 'Paid' ? 'paid' : 'unpaid'}`}>
                  {(sidebarFormData.registrationFees === 'NULL' || !sidebarFormData.registrationFees) ? 'Not Paid' : sidebarFormData.registrationFees}
                </div>
              ) : (
                <select
                  value={sidebarFormData.registrationFees || 'Not Paid'}
                  onChange={(e) => onFieldChange('registrationFees', e.target.value)}
                  className="lead-sidebar-form-select"
                >
                  <option value="Not Paid">Not Paid</option>
                  <option value="Paid">Paid</option>
                </select>
              )}
            </div>

            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">{getFieldLabel('enrolled')}</label>
              {!isEditingMode ? (
                <div className={`lead-sidebar-status-badge ${sidebarFormData.enrolled === 'Yes' ? 'paid' : 'unpaid'}`}>
                  {(sidebarFormData.enrolled === 'NULL' || !sidebarFormData.enrolled) ? 'No' : sidebarFormData.enrolled}
                </div>
              ) : (
                <select
                  value={sidebarFormData.enrolled || 'No'}
                  onChange={(e) => onFieldChange('enrolled', e.target.value)}
                  className="lead-sidebar-form-select"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Counsellor Details Section */}
      <div className="lead-sidebar-section">
        <div className="lead-sidebar-section-layout">
          <div className="lead-sidebar-section-title-container">
            <h6 className="lead-sidebar-section-title">
              Counsellor Details
            </h6>
          </div>
          <div className="lead-sidebar-section-content">
            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">{getFieldLabel('counsellor')}</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {sidebarFormData.counsellor || selectedLead?.counsellor || 'Not Assigned'}
                </div>
              ) : (
                <select
                  value={sidebarFormData.counsellor || ''}
                  onChange={(e) => onFieldChange('counsellor', e.target.value)}
                  className="lead-sidebar-form-select"
                >
                  <option value="" disabled>Select Counsellor</option>
                  {settingsData?.counsellors?.map(counsellor => (
                    <option key={counsellor.id} value={counsellor.name}>
                      {counsellor.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Fields Section */}
      {customFields.length > 0 ? (
        <div className="lead-sidebar-section">
          <div className="lead-sidebar-section-layout">
            <div className="lead-sidebar-section-title-container">
              <h6 className="lead-sidebar-section-title">
                Other Fields 
              </h6>
            </div>
            <div className="lead-sidebar-section-content">
              {customFields.map((field) => {
                const fieldKey = getConsistentFieldKey(field);
                
                return (
                  <div key={field.id || field.name} className="lead-sidebar-form-row">
                    <label className="lead-sidebar-form-label">
                      {field.name}
                      {field.mandatory && <span style={{ color: 'red' }}> *</span>}
                    </label>
                    {renderCustomFieldInput(field)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="lead-sidebar-section">
          <div className="lead-sidebar-section-layout">
            <div className="lead-sidebar-section-title-container">
              <h6 className="lead-sidebar-section-title">
                Other Fields
              </h6>
            </div>
            <div className="lead-sidebar-section-content">
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No additional fields configured.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoTab;