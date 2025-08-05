// server/controllers/leadsController.js - CORRECTED VERSION
const { supabase } = require('../config/supabase');
const { 
  getSettingsData,
  validateLeadData, 
  convertAPIToDatabase,
  getFieldLabel
} = require('../utils/leadHelper.js');
const { logLeadCreated } = require('../utils/historyLogger.js');

// Get field options for Make.com - CORRECTED
const getOptions = async (req, res) => {
  try {
    console.log('=== API OPTIONS REQUEST ===');

    // Use unified settings table like main application
    const settingsData = await getSettingsData(supabase);

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

    // Format response for Make.com using ONLY active items
    const options = {
      requiredFields: ['parentsName', 'kidsName', 'phone'],
      optionalFields: ['location', 'secondPhone', 'email', 'occupation', 'notes'],
      
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

      // Use proper field labels from settings using getFieldLabel function
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
        notes: getFieldLabel('notes', settingsData.form_fields) || 'Notes'
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

      // Use active items for defaults
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

    res.status(200).json({
      success: true,
      message: 'Field options retrieved successfully',
      data: options,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Options Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

// Create new lead from Make.com - CORRECTED
const createLead = async (req, res) => {
  try {
    console.log('=== API LEAD CREATION REQUEST ===');
    console.log('Request body:', req.body);

    // Get settings data using unified settings table
    const settingsData = await getSettingsData(supabase);

    console.log('Settings data loaded for validation');

    // Validate the incoming data using settings
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

    // Convert API data to database format using settings
    const dbData = convertAPIToDatabase(req.body, settingsData);

    // Check for duplicate phone number (optional)
    if (req.body.checkDuplicate !== false) {
      console.log('Checking for duplicate phone:', dbData.phone);
      
      const { data: existingLead, error: duplicateError } = await supabase
        .from('Leads')
        .select('id, parents_name, kids_name')
        .eq('phone', dbData.phone)
        .maybeSingle();

      if (duplicateError) {
        console.error('Error checking duplicate:', duplicateError);
      }

      if (existingLead) {
        console.log('Duplicate phone found:', existingLead);
        return res.status(409).json({
          success: false,
          error: 'Duplicate phone number',
          details: {
            existingLead: {
              id: existingLead.id,
              parentsName: existingLead.parents_name,
              kidsName: existingLead.kids_name
            }
          }
        });
      }
    }

    console.log('Inserting new lead into database...');

    // Insert new lead into database
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

    // Log the lead creation
    try {
      const logFormData = {
        ...req.body,
        stage: req.body.stage || settingsData.stages.find(s => s.is_active)?.name
      };
      await logLeadCreated(newLead.id, logFormData);
      console.log('Lead creation logged successfully');
    } catch (logError) {
      console.error('Error logging lead creation:', logError);
      // Don't fail the API call if logging fails
    }

    // Return success response
    res.status(201).json({
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
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

module.exports = {
  getOptions,
  createLead
};