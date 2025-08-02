import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useSettingsData } from '../contexts/SettingsDataProvider';
import { 
  logLeadCreated
} from '../utils/historyLogger';

const AddLeadForm = ({ isOpen, onClose, onSubmit, existingLeads = [] }) => {
  // ← UPDATED: Use settings data context with stage_key support
  const { 
    settingsData, 
    getFieldLabel, // ← NEW: For dynamic field labels
    getStageInfo,
    getStageColor,
    getStageScore, 
    getStageCategory,
    getStageKeyFromName, // ← NEW: Convert stage name to stage_key
    getStageNameFromKey, // ← NEW: Convert stage_key to stage name
    stageKeyToDataMapping, // ← NEW: Direct stage data mapping
    loading: settingsLoading 
  } = useSettingsData();

  const [formData, setFormData] = useState({
    id: 0, // Will be auto-generated for new leads
    parentsName: '',
    kidsName: '',
    location: '',
    phone: '',
    secondPhone: '', // ← NEW: Secondary phone field
    email: '',
    grade: '',
    notes: '',
    stage: '', // ← Will store stage_key
    category: 'New',
    offer: 'No offer',
    counsellor: 'Assign Counsellor',
    score: 20,
    source: '',
    occupation: '',
    createdTime: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  

 

  // ← NEW: Helper functions for stage_key conversion
  const getStageKeyForLead = (stageValue) => {
    // If it's already a stage_key, return it
    if (stageKeyToDataMapping[stageValue]) {
      return stageValue;
    }
    // Otherwise, convert stage name to stage_key
    return getStageKeyFromName(stageValue) || stageValue;
  };

  const getStageDisplayName = (stageValue) => {
    // If it's a stage_key, get the display name
    if (stageKeyToDataMapping[stageValue]) {
      return getStageNameFromKey(stageValue);
    }
    // Otherwise, it's probably already a stage name
    return stageValue;
  };

  // ← UPDATED: Use useMemo with stage_key support
  const stages = useMemo(() => 
    settingsData.stages.map(stage => ({
      value: stage.stage_key || stage.name, // ← Use stage_key if available
      label: stage.name, // ← Display name
      color: stage.color || '#B3D7FF'
    })), [settingsData.stages]
  );

  // ← UPDATED: Get offers from settings with field_key awareness
  const offers = useMemo(() => {
    const offerField = settingsData.formFields.find(field => 
      field.field_key === 'offer' || field.name === 'Offer'
    );
    return offerField?.dropdown_options?.length > 0 
      ? ['No offer', ...offerField.dropdown_options]
      : ['No offer', '30000 Scholarship', '10000 Discount', 'Welcome Kit', 'Accessible Kit'];
  }, [settingsData.formFields]);

  // Get sources from settings
  const sources = useMemo(() => 
    settingsData.sources.length > 0 
      ? settingsData.sources.map(source => source.name)
      : ['Instagram', 'Facebook', 'Google Ads', 'Referral', 'Walk-in', 'Phone Call', 'Email', 'Website', 'Other'],
    [settingsData.sources]
  );

  // Get grades from settings
  const grades = useMemo(() => 
    settingsData.grades.length > 0 
      ? settingsData.grades.map(grade => grade.name)
      : ['LKG', 'UKG', 'Grade I', 'Grade II', 'Grade III', 'Grade IV', 'Grade V', 'Grade VI', 'Grade VII', 'Grade VIII', 'Grade IX', 'Grade X'],
    [settingsData.grades]
  );

  // Get counsellors from settings
  const counsellors = useMemo(() => 
    settingsData.counsellors.length > 0 
      ? ['Assign Counsellor', ...settingsData.counsellors.map(c => c.name)]
      : ['Assign Counsellor', 'Sachin', 'Rohit', 'Mukhesh'],
    [settingsData.counsellors]
  );

  // ← UPDATED: Reset form when modal opens with stage_key support
  useEffect(() => {
    if (isOpen && !settingsLoading) {
      const defaultStageKey = stages[0]?.value || '';
      const defaultData = {
        id: 0,
        parentsName: '',
        kidsName: '',
        location: '',
        phone: '',
        secondPhone: '', // ← NEW: Reset secondary phone
        email: '',
        grade: settingsData.grades[0]?.name || 'LKG',
        notes: '',
        stage: defaultStageKey, // ← Store stage_key
        category: 'New',
        offer: 'No offer',
        counsellor: 'Assign Counsellour',
        score: 20,
        source: settingsData.sources[0]?.name || 'Instagram',
        occupation: '',
        createdTime: ''
      };
      
      console.log('=== ADD LEAD FORM RESET ===');
      console.log('Default stage key:', defaultStageKey);
      console.log('Available stages:', stages);
      
      setFormData(defaultData);
      setErrors({});
    }
  }, [isOpen, settingsLoading, settingsData.grades, settingsData.sources, stages]);

  // ← UPDATED: Convert form data to database format with stage_key support
  const convertFormToDatabase = (formData) => {
    console.log('=== CONVERTING FORM TO DATABASE ===');
    console.log('Form data stage:', formData.stage);
    
    // Ensure we're storing stage_key in database
    const stageKey = getStageKeyForLead(formData.stage);
    console.log('Stage key for database:', stageKey);
    
    const dbData = {
      parents_name: formData.parentsName,
      kids_name: formData.kidsName,
      phone: `+91${formData.phone}`,
      second_phone: formData.secondPhone ? `+91${formData.secondPhone}` : '', // ← NEW: Secondary phone field
      email: formData.email || '',
      location: formData.location || '',
      grade: formData.grade || '',
      stage: stageKey, // ← Store stage_key in database
      score: formData.score,
      category: formData.category,
      counsellor: formData.counsellor,
      offer: formData.offer,
      notes: formData.notes || '',
      source: formData.source,
      occupation: formData.occupation || '',
      updated_at: new Date().toISOString()
    };

    console.log('Final database data:', dbData);
    return dbData;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let updatedFormData = { ...formData, [name]: value };

    // ← UPDATED: Auto-update score and category when stage changes using stage_key
    if (name === 'stage') {
      console.log('=== STAGE CHANGE IN FORM ===');
      console.log('New stage value:', value);
      
      const stageKey = getStageKeyForLead(value);
      console.log('Stage key:', stageKey);
      
      updatedFormData.score = getStageScore(stageKey);
      updatedFormData.category = getStageCategory(stageKey);
      
      console.log('Updated score:', updatedFormData.score);
      console.log('Updated category:', updatedFormData.category);
    }

    // Format phone numbers
    if (name === 'phone' || name === 'secondPhone') {
      // Remove any non-digit characters
      const digits = value.replace(/\D/g, '');
      // Limit to 10 digits
      const limitedDigits = digits.slice(0, 10);
      updatedFormData[name] = limitedDigits;
    }

    setFormData(updatedFormData);
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.parentsName.trim()) {
      newErrors.parentsName = `${getFieldLabel('parentsName')} is required`;
    }

   

    if (!formData.kidsName.trim()) {
      newErrors.kidsName = `${getFieldLabel('kidsName')} is required`;
    }

    

    if (!formData.phone.trim()) {
      newErrors.phone = `${getFieldLabel('phone')} is required`;
    } else if (formData.phone.length !== 10) {
      newErrors.phone = `${getFieldLabel('phone')} must be exactly 10 digits`;
    }

    // ← UPDATED: Secondary phone validation with dynamic label
    if (formData.secondPhone && formData.secondPhone.length !== 10) {
      newErrors.secondPhone = `${getFieldLabel('secondPhone')} must be exactly 10 digits`;
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Counsellor Assign Check
    if (formData.counsellor === 'Assign Counsellor') {
      newErrors.counsellor = `Please select a ${getFieldLabel('counsellor').toLowerCase()}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // REPLACE THE ENTIRE handleSubmit FUNCTION WITH:
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  setLoading(true);

  try {
    // Convert form data to database format
    const dbData = convertFormToDatabase(formData);

    // INSERT new lead
    const { data, error } = await supabase
      .from('Leads')
      .insert([dbData])
      .select();

    if (error) {
      throw error;
    }

    const newLeadId = data[0].id;

    // Log the new lead creation with stage display name
    const stageDisplayName = getStageDisplayName(formData.stage);
    const logFormData = {
      ...formData,
      stage: stageDisplayName
    };
    await logLeadCreated(newLeadId, logFormData);

    console.log('✅ New lead created:', data);

    alert('✅ New lead added successfully!');

    // Call onSubmit to refresh parent data
    onSubmit();
    onClose();

    // Reset form
    const defaultStageKey = stages[0]?.value || '';
    setFormData({
      id: 0,
      parentsName: '',
      kidsName: '',
      location: '',
      phone: '',
      secondPhone: '', // ← NEW: Reset secondary phone
      email: '',
      grade: settingsData.grades[0]?.name || 'LKG',
      notes: '',
      stage: defaultStageKey,
      category: 'New',
      counsellor: 'Assign Counsellor',
      score: 20,
      source: settingsData.sources[0]?.name || 'Instagram',
      occupation: '',
      createdTime: ''
    });

  } catch (error) {
    console.error('❌ Database error:', error);
    alert('❌ Error saving lead: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  // Don't render if not open or settings are still loading
  if (!isOpen || settingsLoading) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="modal-overlay" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add New Lead</h5>
            <button type="button" className="close-modal-btn" onClick={onClose}>×</button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                {/* ← UPDATED: Parents Name with dynamic field label */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">{getFieldLabel('parentsName')} *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.parentsName ? 'is-invalid' : ''}`}
                    name="parentsName"
                    value={formData.parentsName}
                    onChange={handleInputChange}
                    placeholder={`Enter ${getFieldLabel('parentsName').toLowerCase()}`}
                    disabled={loading}
                  />
                  {errors.parentsName && <div className="invalid-feedback">{errors.parentsName}</div>}
                </div>

                {/* ← UPDATED: Kids Name with dynamic field label */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">{getFieldLabel('kidsName')} *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.kidsName ? 'is-invalid' : ''}`}
                    name="kidsName"
                    value={formData.kidsName}
                    onChange={handleInputChange}
                    placeholder={`Enter ${getFieldLabel('kidsName').toLowerCase()}`}
                    disabled={loading}
                  />
                  {errors.kidsName && <div className="invalid-feedback">{errors.kidsName}</div>}
                </div>

                {/* ← UPDATED: Location with dynamic field label */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">{getFieldLabel('location')} </label>
                  <input
                    type="text"
                    className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder={`Enter ${getFieldLabel('location').toLowerCase()}`}
                    disabled={loading}
                  />
                  {errors.location && <div className="invalid-feedback">{errors.location}</div>}
                </div>

                {/* ← UPDATED: Phone Number with dynamic field label */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">{getFieldLabel('phone')} *</label>
                  <div className="input-group">
                    <span className="input-group-text">+91</span>
                    <input
                      type="text"
                      className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter 10-digit number"
                      maxLength="10"
                      disabled={loading}
                    />
                    {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                  </div>
                </div>

                {/* ← UPDATED: Secondary Phone Number with dynamic label from settings */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">{getFieldLabel('secondPhone')}</label>
                  <div className="input-group">
                    <span className="input-group-text">+91</span>
                    <input
                      type="text"
                      className={`form-control ${errors.secondPhone ? 'is-invalid' : ''}`}
                      name="secondPhone"
                      value={formData.secondPhone}
                      onChange={handleInputChange}
                      placeholder={`Enter 10-digit ${getFieldLabel('secondPhone').toLowerCase()} (optional)`}
                      maxLength="10"
                      disabled={loading}
                    />
                    {errors.secondPhone && <div className="invalid-feedback">{errors.secondPhone}</div>}
                  </div>
                </div>

                {/* ← UPDATED: Email with dynamic field label */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">{getFieldLabel('email')} </label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={`Enter ${getFieldLabel('email').toLowerCase()}`}
                    disabled={loading}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                {/* ← UPDATED: Source with dynamic field label */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">{getFieldLabel('source')}</label>
                  <select
                    className="form-select"
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    {sources.map(source => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ← UPDATED: Grade with dynamic field label */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">{getFieldLabel('grade')} *</label>
                  <select
                    className={`form-select ${errors.grade ? 'is-invalid' : ''}`}
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    {grades.map(grade => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                  {errors.grade && <div className="invalid-feedback">{errors.grade}</div>}
                </div>

                {/* ← UPDATED: Stage with dynamic field label and stage_key support */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">{getFieldLabel('stage')}</label>
                  <select
                    className="form-select"
                    name="stage"
                    value={formData.stage}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    {stages.map(stage => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label} {/* ← Display stage name */}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ← UPDATED: Counsellor with dynamic field label */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">{getFieldLabel('counsellor')}</label>
                  <select
                    className={`form-select ${errors.counsellor ? 'is-invalid' : ''}`}
                    name="counsellor"
                    value={formData.counsellor}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    {counsellors.map(counsellor => (
                      <option key={counsellor} value={counsellor}>
                        {counsellor}
                      </option>
                    ))}
                  </select>
                  {errors.counsellor && <div className="invalid-feedback">{errors.counsellor}</div>}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                type="submit" 
                className="btn btn-primary lead-add"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span>⏳ Adding...</span>
                  </>
                ) : (
                  <span>Add Lead</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      
    </>
  );
};

export default AddLeadForm;