import React from 'react';

const InfoTab = ({
  selectedLead,
  isEditingMode,
  sidebarFormData,
  onFieldChange
}) => {
  // Source options
  const sources = [
    'Instagram',
    'Facebook',
    'Google Ads',
    'Referral',
    'Walk-in',
    'Phone Call',
    'Email',
    'Website',
    'Other'
  ];

  // Grade options
  const grades = [
    'LKG',
    'UKG',
    'Grade I',
    'Grade II',
    'Grade III',
    'Grade IV',
    'Grade V',
    'Grade VI',
    'Grade VII',
    'Grade VIII',
    'Grade IX',
    'Grade X'
  ];

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
              <label className="lead-sidebar-form-label">Occupation</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {(sidebarFormData.occupation === 'NULL' || !sidebarFormData.occupation) ? '' : sidebarFormData.occupation}
                </div>
              ) : (
                <input 
                  type="text" 
                  value={sidebarFormData.occupation || ''} 
                  onChange={(e) => onFieldChange('occupation', e.target.value)}
                  placeholder="Enter occupation"
                  className="lead-sidebar-form-input"
                />
              )}
            </div>

            {/* Source */}
            <div className="lead-sidebar-form-row">
              <label className="lead-sidebar-form-label">Source</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {selectedLead?.source || 'Instagram'}
                </div>
              ) : (
                <select
                  value={sidebarFormData.source || selectedLead?.source || 'Instagram'}
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
                  value={sidebarFormData.grade || selectedLead?.grade || 'LKG'}
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
              <label className="lead-sidebar-form-label">Location</label>
              {!isEditingMode ? (
                <div className="lead-sidebar-field-value">
                  {sidebarFormData.location || ''}
                </div>
              ) : (
                <input 
                  type="text" 
                  value={sidebarFormData.location || ''} 
                  onChange={(e) => onFieldChange('location', e.target.value)}
                  placeholder="Enter location"
                  className="lead-sidebar-form-input"
                />
              )}
            </div>

            {/* Current School */}
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
                  value={sidebarFormData.meetingDate || ''} 
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
                  value={sidebarFormData.meetingTime || ''} 
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
                  value={sidebarFormData.meetingLink || ''} 
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
                  value={sidebarFormData.visitDate || ''} 
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
                  value={sidebarFormData.visitTime || ''} 
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
                  value={sidebarFormData.visitLocation || ''} 
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
              <label className="lead-sidebar-form-label">Enrolled</label>
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
    </div>
  );
};

export default InfoTab;