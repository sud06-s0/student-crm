// server/utils/leadHelpers.js

// Helper function to get stage key from name
function getStageKeyFromName(stageName, stages) {
  const stage = stages.find(s => s.name === stageName);
  return stage?.stage_key || stage?.name || stageName;
}

// Helper function to get stage info
function getStageInfo(stageKey, stages) {
  const stage = stages.find(s => s.stage_key === stageKey || s.name === stageKey);
  return {
    score: stage?.score || 20,
    category: stage?.category || 'New',
    color: stage?.color || '#B3D7FF'
  };
}

// Helper function to get field label
function getFieldLabel(fieldKey, formFields) {
  const field = formFields.find(f => f.field_key === fieldKey || f.name === fieldKey);
  return field?.label || fieldKey;
}

// Validation function
function validateLeadData(data, settingsData) {
  const errors = {};

  console.log('Validating lead data:', data);

  // Required fields validation
  if (!data.parentsName?.trim()) {
    errors.parentsName = 'Parent name is required';
  }

  if (!data.kidsName?.trim()) {
    errors.kidsName = 'Kid name is required';
  }

  if (!data.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else {
    // Remove any non-digit characters for validation
    const digits = data.phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }
  }

  // Secondary phone validation (optional)
  if (data.secondPhone?.trim()) {
    const secondDigits = data.secondPhone.replace(/\D/g, '');
    if (secondDigits.length !== 10) {
      errors.secondPhone = 'Secondary phone must be exactly 10 digits';
    }
  }

  // Email validation (optional but must be valid if provided)
  if (data.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Grade validation
  if (data.grade) {
    const validGrades = settingsData.grades.map(g => g.name);
    if (!validGrades.includes(data.grade)) {
      errors.grade = `Invalid grade. Valid options: ${validGrades.join(', ')}`;
    }
  }

  // Source validation
  if (data.source) {
    const validSources = settingsData.sources.map(s => s.name);
    if (!validSources.includes(data.source)) {
      errors.source = `Invalid source. Valid options: ${validSources.join(', ')}`;
    }
  }

  // Counsellor validation
  if (data.counsellor && data.counsellor !== 'Assign Counsellor') {
    const validCounsellors = settingsData.counsellors.map(c => c.name);
    if (!validCounsellors.includes(data.counsellor)) {
      errors.counsellor = `Invalid counsellor. Valid options: ${validCounsellors.join(', ')}`;
    }
  }

  // Stage validation
  if (data.stage) {
    const validStages = settingsData.stages.map(s => s.name);
    if (!validStages.includes(data.stage)) {
      errors.stage = `Invalid stage. Valid options: ${validStages.join(', ')}`;
    }
  }

  console.log('Validation errors:', errors);
  return errors;
}

// Convert API data to database format
function convertAPIToDatabase(apiData, settingsData) {
  console.log('Converting API data to database format:', apiData);
  
  // Get stage information
  const stageKey = getStageKeyFromName(apiData.stage || settingsData.stages[0]?.name, settingsData.stages);
  const stageInfo = getStageInfo(stageKey, settingsData.stages);
  
  console.log('Stage conversion:', {
    originalStage: apiData.stage,
    stageKey: stageKey,
    stageInfo: stageInfo
  });
  
  // Format phone numbers
  const formatPhone = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits ? `+91${digits}` : '';
  };

  const dbData = {
    parents_name: apiData.parentsName || '',
    kids_name: apiData.kidsName || '',
    phone: formatPhone(apiData.phone),
    second_phone: formatPhone(apiData.secondPhone),
    email: apiData.email || '',
    location: apiData.location || '',
    grade: apiData.grade || settingsData.grades[0]?.name || 'LKG',
    stage: stageKey,
    score: stageInfo.score,
    category: stageInfo.category,
    counsellor: apiData.counsellor || 'Assign Counsellor',
    offer: apiData.offer || 'No offer',
    notes: apiData.notes || '',
    source: apiData.source || settingsData.sources[0]?.name || 'Instagram',
    occupation: apiData.occupation || '',
    updated_at: new Date().toISOString()
  };

  console.log('Converted database data:', dbData);
  return dbData;
}

// Format phone for display
function formatPhoneForDisplay(phone) {
  if (!phone) return '';
  return phone.replace('+91', '').trim();
}

// Validate phone number format
function isValidPhone(phone) {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}

// Validate email format
function isValidEmail(email) {
  if (!email) return true; // Email is optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Get default values for form
function getDefaultValues(settingsData) {
  return {
    grade: settingsData.grades[0]?.name || 'LKG',
    source: settingsData.sources[0]?.name || 'Instagram',
    stage: settingsData.stages[0]?.name || 'New Lead',
    counsellor: 'Assign Counsellor',
    offer: 'No offer',
    category: 'New',
    score: 20
  };
}

module.exports = {
  getStageKeyFromName,
  getStageInfo,
  getFieldLabel,
  validateLeadData,
  convertAPIToDatabase,
  formatPhoneForDisplay,
  isValidPhone,
  isValidEmail,
  getDefaultValues
};