import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Stage1ActionButton from './Stage1ActionButton';
import { 
  logLeadCreated, 
  logSpecificChanges
} from '../utils/historyLogger';

const AddLeadForm = ({ isOpen, onClose, onSubmit, existingLeads = [], editLead = null }) => {
  const [formData, setFormData] = useState({
    id: 0, // Will be auto-generated for new leads
    parentsName: '',
    kidsName: '',
    location: '',
    phone: '',
    email: '',
    grade: 'LKG',
    notes: '',
    stage: 'New Lead',
    category: 'New',
    offer: 'No offer',
    counsellor: 'Assign Counsellor',
    score: 20,
    source: 'Instagram',
    occupation: '',
    createdTime: ''
  });

  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Check if we're in edit mode
  const isEditMode = editLead !== null;

  // Pre-populate form data when editing
  useEffect(() => {
    if (isEditMode && editLead) {
      const editData = {
        ...editLead,
        phone: editLead.phone.replace('+91', ''), // Remove +91 prefix for editing
        email: editLead.email || '',
        source: editLead.source || 'Instagram',
        occupation: editLead.occupation || ''
      };
      setFormData(editData);
      setOriginalData(editData);
    } else {
      // Reset form for new lead
      const defaultData = {
        id: 0,
        parentsName: '',
        kidsName: '',
        location: '',
        phone: '',
        email: '',
        grade: 'LKG',
        notes: '',
        stage: 'New Lead',
        category: 'New',
        offer: 'No offer',
        counsellor: 'Assign Counsellor',
        score: 20,
        source: 'Instagram',
        occupation: '',
        createdTime: ''
      };
      setFormData(defaultData);
      setOriginalData({});
    }
  }, [isEditMode, editLead]);

  

  // Updated Stage options with new stages
  const stages = [
    { value: 'New Lead', label: 'New Lead' },
    { value: 'Connected', label: 'Connected' },
    { value: 'Meeting Booked', label: 'Meeting Booked' },
    { value: 'Meeting Done', label: 'Meeting Done' },
    { value: 'Proposal Sent', label: 'Proposal Sent' },
    { value: 'Visit Booked', label: 'Visit Booked' },
    { value: 'Visit Done', label: 'Visit Done' },
    { value: 'Registered', label: 'Registered' },
    { value: 'Admission', label: 'Admission' },
    { value: 'No Response', label: 'No Response' }
  ];

  // Updated offers with "No offer" as default
  const offers = [
    'No offer',
    '30000 Scholarship',
    '10000 Discount',
    'Welcome Kit',
    'Accessible Kit'
  ];

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

  // Updated counsellors with "Assign Counsellor" as default
  const counsellors = [
    'Assign Counsellor',
    'Sachin',
    'Rohit',
    'Mukhesh'
  ];

  // Updated scoring system to match new stages
  const getScoreFromStage = (stage) => {
    const scoreMap = {
      'New Lead': 20,
      'Connected': 30,
      'Meeting Booked': 40,
      'Meeting Done': 50,
      'Proposal Sent': 60,
      'Visit Booked': 70,
      'Visit Done': 80,
      'Registered': 90,
      'Admission': 100,
      'No Response': 0
    };
    return scoreMap[stage] || 20;
  };

  // Updated category mapping to match new stages
  const getCategoryFromStage = (stage) => {
    const categoryMap = {
      'New Lead': 'New',
      'Connected': 'Warm',
      'Meeting Booked': 'Warm',
      'Meeting Done': 'Warm',
      'Proposal Sent': 'Warm',
      'Visit Booked': 'Hot',
      'Visit Done': 'Hot',
      'Registered': 'Hot',
      'Admission': 'Enrolled',
      'No Response': 'Cold'
    };
    return categoryMap[stage] || 'New';
  };

  // Convert form data to database format
  const convertFormToDatabase = (formData) => {
    const dbData = {
      parents_name: formData.parentsName,
      kids_name: formData.kidsName,
      phone: `+91${formData.phone}`,
      email: formData.email || '',
      location: formData.location || '',
      grade: formData.grade || '',
      stage: formData.stage,
      score: formData.score,
      category: formData.category,
      counsellor: formData.counsellor,
      offer: formData.offer,
      notes: formData.notes || '',
      source: formData.source,
      occupation: formData.occupation || '',
      updated_at: new Date().toISOString()
    };

    return dbData;
  };

  //filter states
const [showStage1Action, setShowStage1Action] = useState(false);
const [newLeadData, setNewLeadData] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let updatedFormData = { ...formData, [name]: value };

    // Auto-update score and category when stage changes
    if (name === 'stage') {
      updatedFormData.score = getScoreFromStage(value);
      updatedFormData.category = getCategoryFromStage(value);
    }

    

    // Format phone number
    if (name === 'phone') {
      // Remove any non-digit characters
      const digits = value.replace(/\D/g, '');
      // Limit to 10 digits
      const limitedDigits = digits.slice(0, 10);
      updatedFormData.phone = limitedDigits;
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
      newErrors.parentsName = 'Parents Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }

   

    if (!formData.kidsName.trim()) {
      newErrors.kidsName = 'Kids Name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone Number is required';
    } else if (formData.phone.length !== 10) {
      newErrors.phone = 'Phone Number must be exactly 10 digits';
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

     //Counsellor Assign Check
    if (formData.counsellor === 'Assign Counsellor') {
  newErrors.counsellor = 'Please select a counsellor';
}

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to log changes when editing
  const logEditChanges = async (leadId, originalData, newData) => {
    const changes = {};
    
    // Compare all fields and track changes
    Object.keys(newData).forEach(field => {
      if (originalData[field] !== newData[field]) {
        changes[field] = {
          oldValue: originalData[field],
          newValue: newData[field]
        };
      }
    });

    // Use detailed logging for form updates (basic fields only)
    if (Object.keys(changes).length > 0) {
      await logSpecificChanges(leadId, originalData, newData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Convert form data to database format
      const dbData = convertFormToDatabase(formData);

      if (isEditMode) {
        // UPDATE existing lead
        const { error } = await supabase
          .from('Leads')
          .update(dbData)
          .eq('id', formData.id);

        if (error) {
          throw error;
        }

        // Log the changes
        await logEditChanges(formData.id, originalData, formData);

        console.log('✅ Lead updated successfully');
        alert('✅ Lead updated successfully!');

      } else {
  // INSERT new lead
  const { data, error } = await supabase
    .from('Leads')
    .insert([dbData])
    .select();

  if (error) {
    throw error;
  }

  const newLeadId = data[0].id;

  // Log the new lead creation
  await logLeadCreated(newLeadId, formData);

  console.log('✅ New lead created:', data);

  onSubmit();
  
  // Trigger Stage 1 API call
  setNewLeadData({
    phone: `+91${formData.phone}`,
    parentsName: formData.parentsName,
    kidsName: formData.kidsName,
    grade: formData.grade
  });
  setShowStage1Action(true);

  alert('✅ New lead added successfully!');

  return;
}

      // Call parent's onSubmit to refresh data
      

      // Reset form only if not in edit mode
      if (!isEditMode) {
        setFormData({
          id: 0,
          parentsName: '',
          kidsName: '',
          location: '',
          phone: '',
          email: '',
          grade: 'LKG',
          notes: '',
          stage: 'New Lead',
          category: 'New',
          counsellor: 'Assign Counsellor',
          score: 20,
          source: 'Instagram',
          occupation: '',
          createdTime: ''
        });
      }
      
      // Close the form
      onClose();

    } catch (error) {
      console.error('❌ Database error:', error);
      alert('❌ Error saving lead: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="modal-overlay" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {isEditMode ? 'Edit Lead' : 'Add New Lead'}
            </h5>
            <button type="button" className="close-modal-btn" onClick={onClose}>×</button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                {/*
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    {isEditMode ? 'ID' : 'ID (Auto-generated)'}
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={isEditMode ? formData.id : 'Auto-generated'}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}
                  />
                </div>*/}

                {/* Parents Name */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Parents Name *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.parentsName ? 'is-invalid' : ''}`}
                    name="parentsName"
                    value={formData.parentsName}
                    onChange={handleInputChange}
                    placeholder="Enter parent's name"
                    disabled={loading}
                  />
                  {errors.parentsName && <div className="invalid-feedback">{errors.parentsName}</div>}
                </div>

                {/* Kids Name */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Kids Name *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.kidsName ? 'is-invalid' : ''}`}
                    name="kidsName"
                    value={formData.kidsName}
                    onChange={handleInputChange}
                    placeholder="Enter kid's name"
                    disabled={loading}
                  />
                  {errors.kidsName && <div className="invalid-feedback">{errors.kidsName}</div>}
                </div>

                {/* Location */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Location *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter location"
                    disabled={loading}
                  />
                  {errors.location && <div className="invalid-feedback">{errors.location}</div>}
                </div>

                {/* Phone Number */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Phone Number *</label>
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

                {/* Email */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    disabled={loading}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                {/* Source */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Source</label>
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

                {/* Occupation */}
                {/*<div className="col-md-6 mb-3">
                  <label className="form-label">Occupation</label>
                  <input
                    type="text"
                    className="form-control"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    placeholder="Enter occupation"
                    disabled={loading}
                  />
                </div>*/}

                {/* Grade */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Grade *</label>
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

                {/* Stage */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Stage</label>
                  <select
                    className="form-select"
                    name="stage"
                    value={formData.stage}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    {stages.map(stage => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Counsellor */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Counsellor</label>
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
                </div>
{errors.counsellor && <div className="invalid-feedback">{errors.counsellor}</div>}


               {/*
                <div className="col-md-6 mb-3">
                  <label className="form-label">Offer</label>
                  <select
                    className="form-select"
                    name="offer"
                    value={formData.offer}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    {offers.map(offer => (
                      <option key={offer} value={offer}>
                        {offer}
                      </option>
                    ))}
                  </select>
                </div>*/}

                {/* Score (Read-only, auto-calculated) */}
                {/*<div className="col-md-6 mb-3">
                  <label className="form-label">Score (Auto-calculated)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="score"
                    value={formData.score}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </div>*/}

                {/* Category (Read-only, auto-calculated) */}
                {/*<div className="col-md-6 mb-3">
                  <label className="form-label">Category (Auto-assigned)</label>
                  <input
                    type="text"
                    className="form-control"
                    name="category"
                    value={formData.category}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </div>*/}

                {/* Notes */}
                {/*<div className="col-12 mb-3">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter any additional notes..."
                    disabled={loading}
                  ></textarea>
                </div>*/}
              </div>
            </div>
            
            <div className="modal-footer">
              {/*<button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>*/}
              <button 
                type="submit" 
                className="btn btn-primary lead-add"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span>⏳ {isEditMode ? 'Updating...' : 'Adding...'}</span>
                  </>
                ) : (
                  <span>{isEditMode ? 'Update Lead' : 'Add Lead'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      {console.log('🔍 AddLeadForm render - showStage1Action:', showStage1Action, 'newLeadData:', newLeadData)}

      {showStage1Action && newLeadData && (
      <Stage1ActionButton
        leadData={newLeadData}
        onComplete={(success, error) => {
          console.log(success ? '✅ Stage 1 API call completed' : '❌ Stage 1 API call failed:', error);
          setShowStage1Action(false);
          setNewLeadData(null);

          onClose();
        }}
      />
    )}
    </>
  );
};

export default AddLeadForm;