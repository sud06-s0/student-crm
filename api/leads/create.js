import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

// CORRECTED: Get settings data from unified settings table
async function getSettingsData() {
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

// Helper functions (corrected to match main app)
function getStageKeyFromName(stageName, stages) {
  const stage = stages.find(s => s.name === stageName);
  return stage?.stage_key || stage?.name || stageName;
}

function getStageInfo(stageKey, stages) {
  const stage = stages.find(s => s.stage_key === stageKey || s.name === stageKey);
  return {
    score: stage?.score || 20,
    category: stage?.status || 'New', // Use 'status' field like main app
    color: stage?.color || '#B3D7FF'
  };
}

function validateLeadData(data, settingsData) {
  const errors = {};

  console.log('Validating lead data:', data);

  if (!data.parentsName?.trim()) {
    errors.parentsName = 'Parent name is required';
  }

  if (!data.kidsName?.trim()) {
    errors.kidsName = 'Kid name is required';
  }

  if (!data.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else {
    const digits = data.phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }
  }

  if (data.secondPhone?.trim()) {
    const secondDigits = data.secondPhone.replace(/\D/g, '');
    if (secondDigits.length !== 10) {
      errors.secondPhone = 'Secondary phone must be exactly 10 digits';
    }
  }

  if (data.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (data.grade) {
    const validGrades = settingsData.grades
      .filter(g => g.is_active)
      .map(g => g.name);
    if (!validGrades.includes(data.grade)) {
      errors.grade = `Invalid grade. Valid options: ${validGrades.join(', ')}`;
    }
  }

  if (data.source) {
    const validSources = settingsData.sources
      .filter(s => s.is_active)
      .map(s => s.name);
    if (!validSources.includes(data.source)) {
      errors.source = `Invalid source. Valid options: ${validSources.join(', ')}`;
    }
  }

  if (data.counsellor && data.counsellor !== 'Assign Counsellor') {
    const validCounsellors = settingsData.counsellors
      .filter(c => c.is_active)
      .map(c => c.name);
    if (!validCounsellors.includes(data.counsellor)) {
      errors.counsellor = `Invalid counsellor. Valid options: ${validCounsellors.join(', ')}`;
    }
  }

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

function convertAPIToDatabase(apiData, settingsData) {
  console.log('Converting API data to database format:', apiData);
  
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
    grade: apiData.grade || settingsData.grades.find(g => g.is_active)?.name || 'LKG',
    stage: stageKey, // Store stage_key in database
    score: stageInfo.score,
    category: stageInfo.category,
    counsellor: apiData.counsellor || 'Assign Counsellor',
    offer: apiData.offer || 'No offer',
    notes: apiData.notes || '',
    source: apiData.source || settingsData.sources.find(s => s.is_active)?.name || 'Instagram',
    occupation: apiData.occupation || '',
    current_school: apiData.currentSchool || '',
    updated_at: new Date().toISOString()
  };

  console.log('Converted database data:', dbData);
  return dbData;
}

// History logging function
async function logLeadCreated(leadId, formData) {
  try {
    console.log('Logging lead creation for ID:', leadId);
    
    const historyData = {
      record_id: leadId,
      action: 'Lead Created',
      details: `New lead created via API - ${formData.parentsName} (${formData.kidsName}) - ${formData.phone}`,
      additional_info: {
        source: 'Make.com API',
        stage: formData.stage,
        grade: formData.grade,
        counsellor: formData.counsellor,
        created_via: 'API',
        api_version: '1.0',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    console.log('History data to insert:', historyData);

    const { data, error } = await supabase
      .from('History')
      .insert([historyData])
      .select();

    if (error) {
      console.error('Error logging lead creation:', error);
      throw error;
    } else {
      console.log('Lead creation logged successfully for ID:', leadId, 'History record:', data);
    }
  } catch (error) {
    console.error('Error in logLeadCreated:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== API LEAD CREATION REQUEST ===');
    console.log('Request body:', req.body);

    // CORRECTED: Use unified settings table
    const settingsData = await getSettingsData();

    console.log('Settings data loaded for validation');

    const validationErrors = validateLeadData(req.body, settingsData);
    
    if (Object.keys(validationErrors).length > 0) {
      console.log('Validation failed:', validationErrors);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    console.log('Validation passed, converting data...');

    const dbData = convertAPIToDatabase(req.body, settingsData);

    console.log('Inserting new lead into database...');

    // Insert new lead into database - REMOVED duplicate check
    const { data: newLead, error: insertError } = await supabase
      .from('Leads')
      .insert([dbData])
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log('New lead created successfully:', newLead.id);

    try {
      const logFormData = {
        ...req.body,
        stage: req.body.stage || settingsData.stages.find(s => s.is_active)?.name
      };
      await logLeadCreated(newLead.id, logFormData);
      console.log('Lead creation logged successfully');
    } catch (logError) {
      console.error('Error logging lead creation:', logError);
    }

    return res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: {
        id: newLead.id,
        parentsName: newLead.parents_name,
        kidsName: newLead.kids_name,
        phone: newLead.phone,
        stage: newLead.stage,
        category: newLead.category,
        score: newLead.score,
        createdAt: newLead.created_at
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}