import React from 'react';

const InfoTab = ({
  selectedLead,
  isEditingMode,
  sidebarFormData,
  onFieldChange,
  settingsData, // ← NEW: Receive settings data
  getFieldLabel // ← NEW: Receive getFieldLabel function
}) => {
  // ← UPDATED: Get dynamic sources from settings
  const sources = settingsData?.sources?.map(source => source.name) || ['Instagram'];

  // ← UPDATED: Get dynamic grades from settings
  const grades = settingsData?.grades?.map(grade => grade.name) || ['LKG'];

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

            {/* Phone */}
            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">Phone</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {selectedLead?.phone || ''}
                </div>
              ) : (
                <input 
                  type="text" 
                  value={sidebarFormData.phone || selectedLead?.phone || ''} 
                  onChange={(e) => onFieldChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  className="lead-sidebar-form-input"
                />
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

      {/* Counsellor Details Section - NEW */}
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
    </div>
  );
};

export default InfoTab;