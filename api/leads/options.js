import { createClient } from '@supabase/supabase-js';
import { TABLE_NAMES } from '../config/tableNames';
import { authenticateRequest } from './auth';

// Authentication function
function authenticateRequest(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return { authenticated: false, error: 'Missing or invalid authorization header' };
  }

  try {
    // Extract base64 encoded credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // Define your API credentials (store these in environment variables)
    const API_USERNAME = process.env.API_USERNAME || 'your_api_user';
    const API_PASSWORD = process.env.API_PASSWORD || 'your_secure_password';

    if (username === API_USERNAME && password === API_PASSWORD) {
      return { authenticated: true };
    } else {
      return { authenticated: false, error: 'Invalid credentials' };
    }
  } catch (error) {
    return { authenticated: false, error: 'Invalid authorization format' };
  }
}

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
    .from(TABLE_NAMES.SETTINGS)
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

// Helper function to get field label from settings
function getFieldLabel(fieldKey, formFields) {
  const field = formFields.find(f => f.field_key === fieldKey);
  return field?.name || fieldKey; // Use 'name' not 'label'
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate request
  const authResult = authenticateRequest(req);
  if (!authResult.authenticated) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: authResult.error
    });
  }

  try {
    console.log('=== Authenticated API OPTIONS REQUEST ===');

    // CORRECTED: Use unified settings table
    const settingsData = await getSettingsData();

    console.log('Settings data loaded:', {
      stages: settingsData.stages.length,
      sources: settingsData.sources.length,
      grades: settingsData.grades.length,
      counsellors: settingsData.counsellors.length,
      formFields: settingsData.form_fields.length
    });

    // Get offers from form fields using proper field_key lookup
    const offerField = settingsData.form_fields.find(field => 
      field.field_key === 'offer' || field.name === 'Offer'
    );
    const offers = offerField?.dropdown_options?.length > 0 
      ? ['No offer', ...offerField.dropdown_options]
      : ['No offer', '30000 Scholarship', '10000 Discount', 'Welcome Kit', 'Accessible Kit'];

    const options = {
      requiredFields: ['parentsName', 'kidsName', 'phone'],
      optionalFields: ['location', 'secondPhone', 'email', 'occupation', 'notes', 'currentSchool'],
      
      dropdownOptions: {
        grades: settingsData.grades
          .filter(grade => grade.is_active)
          .map(grade => ({
            value: grade.name,
            label: grade.name,
            id: grade.id
          })),
        
        sources: settingsData.sources
          .filter(source => source.is_active)
          .map(source => ({
            value: source.name,
            label: source.name,
            id: source.id
          })),
        
        stages: settingsData.stages
          .filter(stage => stage.is_active)
          .map(stage => ({
            value: stage.name,
            label: stage.name,
            stageKey: stage.stage_key || stage.name,
            color: stage.color || '#B3D7FF',
            score: stage.score || 20,
            category: stage.status || 'New', // Use 'status' field
            id: stage.id
          })),
        
        counsellors: [
          { value: 'Assign Counsellor', label: 'Assign Counsellor' },
          ...settingsData.counsellors
            .filter(counsellor => counsellor.is_active)
            .map(counsellor => ({
              value: counsellor.name,
              label: counsellor.name,
              id: counsellor.id
            }))
        ],
        
        offers: offers.map(offer => ({
          value: offer,
          label: offer
        }))
      },

      fieldLabels: {
        parentsName: getFieldLabel('parentsName', settingsData.form_fields) || 'Parent Name',
        kidsName: getFieldLabel('kidsName', settingsData.form_fields) || 'Kid Name',
        phone: getFieldLabel('phone', settingsData.form_fields) || 'Phone',
        secondPhone: getFieldLabel('secondPhone', settingsData.form_fields) || 'Secondary Phone',
        email: getFieldLabel('email', settingsData.form_fields) || 'Email',
        location: getFieldLabel('location', settingsData.form_fields) || 'Location',
        grade: getFieldLabel('grade', settingsData.form_fields) || 'Grade',
        source: getFieldLabel('source', settingsData.form_fields) || 'Source',
        stage: getFieldLabel('stage', settingsData.form_fields) || 'Stage',
        counsellor: getFieldLabel('counsellor', settingsData.form_fields) || 'Counsellor',
        offer: getFieldLabel('offer', settingsData.form_fields) || 'Offer',
        occupation: getFieldLabel('occupation', settingsData.form_fields) || 'Occupation',
        notes: getFieldLabel('notes', settingsData.form_fields) || 'Notes',
        currentSchool: getFieldLabel('currentSchool', settingsData.form_fields) || 'Current School'
      },

      validationRules: {
        phone: {
          required: true,
          type: 'string',
          pattern: '^[0-9]{10}$',
          description: 'Must be exactly 10 digits (without +91 prefix)'
        },
        secondPhone: {
          required: false,
          type: 'string',
          pattern: '^[0-9]{10}$',
          description: 'Must be exactly 10 digits (without +91 prefix) if provided'
        },
        email: {
          required: false,
          type: 'email',
          pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
          description: 'Must be a valid email format if provided'
        },
        parentsName: {
          required: true,
          type: 'string',
          minLength: 1,
          description: 'Parent name cannot be empty'
        },
        kidsName: {
          required: true,
          type: 'string',
          minLength: 1,
          description: 'Kid name cannot be empty'
        }
      },

      defaultValues: {
        grade: settingsData.grades.find(g => g.is_active)?.name || 'LKG',
        source: settingsData.sources.find(s => s.is_active)?.name || 'Instagram',
        stage: settingsData.stages.find(s => s.is_active)?.name || 'New Lead',
        counsellor: 'Assign Counsellor',
        offer: 'No offer',
        category: 'New',
        score: 20
      }
    };

    console.log('Options data prepared successfully');

    return res.status(200).json({
      success: true,
      message: 'Field options retrieved successfully',
      data: options,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Options Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}