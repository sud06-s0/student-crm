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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== API OPTIONS REQUEST ===');

    const [stagesRes, sourcesRes, gradesRes, counsellorsRes, formFieldsRes] = await Promise.all([
      supabase.from('stages').select('*').order('id'),
      supabase.from('sources').select('*').order('id'),
      supabase.from('grades').select('*').order('id'),
      supabase.from('counsellors').select('*').order('id'),
      supabase.from('form_fields').select('*').order('id')
    ]);

    const errors = [stagesRes.error, sourcesRes.error, gradesRes.error, counsellorsRes.error, formFieldsRes.error].filter(Boolean);
    if (errors.length > 0) {
      console.error('Database errors:', errors);
      throw new Error(`Database errors: ${errors.map(e => e.message).join(', ')}`);
    }

    const settingsData = {
      stages: stagesRes.data || [],
      sources: sourcesRes.data || [],
      grades: gradesRes.data || [],
      counsellors: counsellorsRes.data || [],
      formFields: formFieldsRes.data || []
    };

    console.log('Settings data loaded:', {
      stages: settingsData.stages.length,
      sources: settingsData.sources.length,
      grades: settingsData.grades.length,
      counsellors: settingsData.counsellors.length,
      formFields: settingsData.formFields.length
    });

    const offerField = settingsData.formFields.find(field => 
      field.field_key === 'offer' || field.name === 'Offer'
    );
    const offers = offerField?.dropdown_options?.length > 0 
      ? ['No offer', ...offerField.dropdown_options]
      : ['No offer', '30000 Scholarship', '10000 Discount', 'Welcome Kit', 'Accessible Kit'];

    const options = {
      requiredFields: ['parentsName', 'kidsName', 'phone'],
      optionalFields: ['location', 'secondPhone', 'email', 'occupation', 'notes'],
      
      dropdownOptions: {
        grades: settingsData.grades.map(grade => ({
          value: grade.name,
          label: grade.name,
          id: grade.id
        })),
        
        sources: settingsData.sources.map(source => ({
          value: source.name,
          label: source.name,
          id: source.id
        })),
        
        stages: settingsData.stages.map(stage => ({
          value: stage.name,
          label: stage.name,
          stageKey: stage.stage_key || stage.name,
          color: stage.color || '#B3D7FF',
          score: stage.score || 20,
          category: stage.category || 'New',
          id: stage.id
        })),
        
        counsellors: [
          { value: 'Assign Counsellor', label: 'Assign Counsellor' },
          ...settingsData.counsellors.map(counsellor => ({
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
        parentsName: settingsData.formFields.find(f => f.field_key === 'parentsName')?.label || 'Parent Name',
        kidsName: settingsData.formFields.find(f => f.field_key === 'kidsName')?.label || 'Kid Name',
        phone: settingsData.formFields.find(f => f.field_key === 'phone')?.label || 'Phone',
        secondPhone: settingsData.formFields.find(f => f.field_key === 'secondPhone')?.label || 'Secondary Phone',
        email: settingsData.formFields.find(f => f.field_key === 'email')?.label || 'Email',
        location: settingsData.formFields.find(f => f.field_key === 'location')?.label || 'Location',
        grade: settingsData.formFields.find(f => f.field_key === 'grade')?.label || 'Grade',
        source: settingsData.formFields.find(f => f.field_key === 'source')?.label || 'Source',
        stage: settingsData.formFields.find(f => f.field_key === 'stage')?.label || 'Stage',
        counsellor: settingsData.formFields.find(f => f.field_key === 'counsellor')?.label || 'Counsellor',
        offer: settingsData.formFields.find(f => f.field_key === 'offer')?.label || 'Offer',
        occupation: settingsData.formFields.find(f => f.field_key === 'occupation')?.label || 'Occupation',
        notes: settingsData.formFields.find(f => f.field_key === 'notes')?.label || 'Notes'
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
        grade: settingsData.grades[0]?.name || 'LKG',
        source: settingsData.sources[0]?.name || 'Instagram',
        stage: settingsData.stages[0]?.name || 'New Lead',
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