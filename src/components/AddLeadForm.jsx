import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Stage1ActionButton from './Stage1ActionButton';
import { 
  logLeadCreated
} from '../utils/historyLogger';

const AddLeadForm = ({ isOpen, onClose, onSubmit, existingLeads = [] }) => {
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

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
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
      setErrors({});
    }
  }, [isOpen]);

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

  // Filter states for Stage1ActionButton
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

    // Counsellor Assign Check
    if (formData.counsellor === 'Assign Counsellor') {
      newErrors.counsellor = 'Please select a counsellor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

      // Trigger Stage 1 API call
      setNewLeadData({
        phone: `+91${formData.phone}`,
        parentsName: formData.parentsName,
        kidsName: formData.kidsName,
        grade: formData.grade
      });
      setShowStage1Action(true);

      // Call onSubmit to refresh parent data
      onSubmit();

      alert('✅ New lead added successfully!');

      // Reset form
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
            <h5 className="modal-title">Add New Lead</h5>
            <button type="button" className="close-modal-btn" onClick={onClose}>×</button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
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

      {/* Stage 1 Action Button Component */}
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