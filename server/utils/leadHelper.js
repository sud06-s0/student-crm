// server/utils/leadHelpers.js - CORRECTED VERSION

// Helper function to get settings data from unified settings table
async function getSettingsData(supabase) {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('sort_order');
    
  if (error) throw error;
  
  // Group by type exactly like main application
  const grouped = {
    stages: [],
    grades: [],
    counsellors: [],
    sources: [],
    form_fields: [],
    school: {}
  };
  
  data?.forEach(item => {
    if (item.type === 'school') {
      grouped.school = item.value || {};
    } else if (grouped[item.type]) {
      const itemData = {
        id: item.id,
        name: item.name,
        field_key: item.field_key,
        stage_key: item.stage_key,
        is_active: item.is_active, 
        sort_order: item.sort_order,
        ...(item.value || {})
      };
      
      // For counsellors, extract user_id from value field for compatibility
      if (item.type === 'counsellors' && item.value && item.value.user_id) {
        itemData.user_id = item.value.user_id;
      }
      
      grouped[item.type].push(itemData);
    }
  });
  
  return grouped;
}

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
    category: stage?.status || 'New', // Use 'status' field like main app
    color: stage?.color || '#B3D7FF'
  };
}

// Helper function to get field label from settings
function getFieldLabel(fieldKey, formFields) {
  const field = formFields.find(f => f.field_key === fieldKey);
  return field?.name || fieldKey; // Use 'name' not 'label'
}

// Validation function using settings data
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

  // Grade validation - only check active grades
  if (data.grade) {
    const validGrades = settingsData.grades
      .filter(g => g.is_active)
      .map(g => g.name);
    if (!validGrades.includes(data.grade)) {
      errors.grade = `Invalid grade. Valid options: ${validGrades.join(', ')}`;
    }
  }

  // Source validation - only check active sources
  if (data.source) {
    const validSources = settingsData.sources
      .filter(s => s.is_active)
      .map(s => s.name);
    if (!validSources.includes(data.source)) {
      errors.source = `Invalid source. Valid options: ${validSources.join(', ')}`;
    }
  }

  // Counsellor validation - only check active counsellors
  if (data.counsellor && data.counsellor !== 'Assign Counsellor') {
    const validCounsellors = settingsData.counsellors
      .filter(c => c.is_active)
      .map(c => c.name);
    if (!validCounsellors.includes(data.counsellor)) {
      errors.counsellor = `Invalid counsellor. Valid options: ${validCounsellors.join(', ')}`;
    }
  }

  // Stage validation - only check active stages
  if (data.stage) {
    const validStages = settingsData.stages
      .filter(s => s.is_active)
      .map(s => s.name);
    if (!validStages.includes(data.stage)) {
      errors.stage = `Invalid stage. Valid options: ${validStages.join(', ')}`;
    }
  }

  console.log('Validation errors:', errors);
  return errors;
}

// Convert API data to database format using settings
function convertAPIToDatabase(apiData, settingsData) {
  console.log('Converting API data to database format:', apiData);
  
  // Get stage information using stage_key
  const stageKey = getStageKeyFromName(
    apiData.stage || settingsData.stages.find(s => s.is_active)?.name, 
    settingsData.stages
  );
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

  // Get default values from active settings
  const defaultGrade = settingsData.grades.find(g => g.is_active)?.name || 'LKG';
  const defaultSource = settingsData.sources.find(s => s.is_active)?.name || 'Instagram';

  const dbData = {
    parents_name: apiData.parentsName || '',
    kids_name: apiData.kidsName || '',
    phone: formatPhone(apiData.phone),
    second_phone: formatPhone(apiData.secondPhone),
    email: apiData.email || '',
    location: apiData.location || '',
    grade: apiData.grade || defaultGrade,
    stage: stageKey, // Store stage_key in database
    score: stageInfo.score,
    category: stageInfo.category,
    counsellor: apiData.counsellor || 'Assign Counsellor',
    offer: apiData.offer || 'No offer',
    notes: apiData.notes || '',
    source: apiData.source || defaultSource,
    occupation: apiData.occupation || '',
    current_school: apiData.currentSchool || '',
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

// Get default values for form using settings
function getDefaultValues(settingsData) {
  return {
    grade: settingsData.grades.find(g => g.is_active)?.name || 'LKG',
    source: settingsData.sources.find(s => s.is_active)?.name || 'Instagram',
    stage: settingsData.stages.find(s => s.is_active)?.name || 'New Lead',
    counsellor: 'Assign Counsellor',
    offer: 'No offer',
    category: 'New',
    score: 20
  };
}

module.exports = {
  getSettingsData,
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