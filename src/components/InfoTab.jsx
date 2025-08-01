import React, { useEffect } from 'react';
import { settingsService } from '../services/settingsService';

const InfoTab = ({
  selectedLead,
  isEditingMode,
  sidebarFormData,
  onFieldChange,
  settingsData,
  getFieldLabel,
  customFieldsData = {},
  onCustomFieldChange
}) => {
  
  
  // Early return if settings not loaded
  if (!settingsData) {
    console.log('settingsData not loaded yet');
    return <div className="lead-sidebar-tab-content">Loading settings...</div>;
  }

  // Get dynamic sources from settings
  const sources = settingsData?.sources?.map(source => source.name) || ['Instagram'];

  // Get dynamic grades from settings
  const grades = settingsData?.grades?.map(grade => grade.name) || ['LKG'];

  // Helper function to identify built-in fields
  function isBuiltInField(fieldName) {
    const builtInFields = [
      'Parents Name', 'Kids Name', 'Phone', 'Email', 'Location', 
      'Occupation', 'Current School', 'Offer', 'Notes', 'Meeting Date', 
      'Meeting Time', 'Meeting Link', 'Visit Date', 'Visit Time', 
      'Visit Location', 'Registration Fees', 'Enrolled', 'Parent Name',
      'Kid Name', 'Class', 'Grade', 'Source', 'Stage', 'Counsellor',
      'Secondary Phone', 'Second Phone' // ← NEW: Add secondary phone variations
    ];
    
    // Also check variations and case differences
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

  console.log('Checking different form field properties:');
  console.log('settingsData.form_fields:', settingsData?.form_fields);
  console.log('settingsData.formFields:', settingsData?.formFields);
  console.log('settingsData.custom_fields:', settingsData?.custom_fields);
  console.log('settingsData.customFields:', settingsData?.customFields);
  console.log('settingsData.fields:', settingsData?.fields);
  console.log('Final formFields array:', formFields);

  // Enhanced custom fields filtering with detailed logging
  const customFields = formFields?.filter(field => {
    console.log('=== Field Analysis ===');
    console.log('Field name:', field.name);
    console.log('Field key:', field.field_key);
    console.log('Field type:', field.field_type);
    console.log('Is active:', field.is_active);
    console.log('Is custom (field.is_custom):', field.is_custom);
    console.log('Has field_key:', !!field.field_key);
    console.log('isBuiltInField result:', isBuiltInField(field.name));
    
    // Simplified approach - only rely on is_custom flag
    const isCustomField = field.is_custom === true;
    
    console.log('Final isCustomField:', isCustomField);
    console.log('Final condition result:', isCustomField && field.is_active);
    console.log('-------------------');
    
    return isCustomField && field.is_active;
  }) || [];

  console.log('Final customFields array:', customFields);
  console.log('customFields.length:', customFields.length);

  // ← IMPROVED: More robust field key generation
  const getConsistentFieldKey = (field) => {
    // Priority 1: Use field_key if it exists
    if (field.field_key) {
      return field.field_key;
    }
    
    // Priority 2: For custom fields without field_key, create a stable key using field ID
    if (field.is_custom && field.id) {
      return `custom_field_${field.id}`;
    }
    
    // Priority 3: Fallback to name-based key (legacy)
    return field.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  };

  // ← NEW: Add this function to fix data migration in InfoTab
  const migrateCustomFieldData = (customFields, currentCustomFieldsData) => {
    const migratedData = { ...currentCustomFieldsData };
    
    customFields.forEach(field => {
      const newKey = getConsistentFieldKey(field);
      const oldKey = field.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      // If data exists with old key but not new key, migrate it
      if (oldKey !== newKey && currentCustomFieldsData[oldKey] && !currentCustomFieldsData[newKey]) {
        migratedData[newKey] = currentCustomFieldsData[oldKey];
        delete migratedData[oldKey];
        
        console.log(`Migrated custom field data: ${oldKey} → ${newKey}`);
        
        // Trigger callback to save the migrated data
        if (onCustomFieldChange) {
          onCustomFieldChange(newKey, currentCustomFieldsData[oldKey]);
        }
      }
    });
    
    return migratedData;
  };

  // ← UPDATE: Add migration call in the component
  useEffect(() => {
    if (customFields.length > 0 && Object.keys(customFieldsData).length > 0) {
      const migratedData = migrateCustomFieldData(customFields, customFieldsData);
      
      // If migration occurred, the onCustomFieldChange callbacks will handle the updates
      if (JSON.stringify(migratedData) !== JSON.stringify(customFieldsData)) {
        console.log('Custom field data migration completed');
      }
    }
  }, [customFields, customFieldsData]);

  // Helper function to render custom field input based on type
  const renderCustomFieldInput = (field) => {
    const fieldKey = getConsistentFieldKey(field);
    const fieldValue = customFieldsData[fieldKey] || '';

    console.log('Rendering field:', field.name, 'fieldKey:', fieldKey, 'fieldValue:', fieldValue);

    if (!isEditingMode) {
      // View mode
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
      // Edit mode
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
        // Default to text input
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

  // ← NEW: Helper function to format phone number for display
  const formatPhoneForDisplay = (phoneNumber) => {
    if (!phoneNumber) return '';
    // Remove +91 prefix if present for display
    return phoneNumber.replace(/^\+91/, '');
  };

  // ← NEW: Helper function to handle phone number input changes
  const handlePhoneChange = (fieldName, value) => {
    // Remove any non-digit characters
    const digits = value.replace(/\D/g, '');
    // Limit to 10 digits
    const limitedDigits = digits.slice(0, 10);
    onFieldChange(fieldName, limitedDigits);
  };

  // Debug custom fields section rendering
  console.log('=== Custom Fields Section Check ===');
  console.log('customFields.length > 0:', customFields.length > 0);
  console.log('Will render custom fields section:', customFields.length > 0);

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

            {/* ← NEW: Secondary Phone Number */}
            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">Secondary Phone</label>
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
                    placeholder="Enter 10-digit number (optional)"
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

      {/* Custom Fields Section - Enhanced with consistent field keys */}
      
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