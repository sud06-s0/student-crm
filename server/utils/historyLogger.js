// server/utils/historyLogger.js - CORRECTED VERSION
const { supabase } = require('../config/supabase');

// History logging function - matches main application pattern
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

// Additional history logging functions for completeness
async function logStageChange(leadId, oldStage, newStage, changedBy = 'API') {
  try {
    console.log('Logging stage change for ID:', leadId);
    
    const historyData = {
      record_id: leadId,
      action: 'Stage Changed',
      details: `Stage changed from "${oldStage}" to "${newStage}" via ${changedBy}`,
      additional_info: {
        old_stage: oldStage,
        new_stage: newStage,
        changed_by: changedBy,
        changed_via: 'API',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('History')
      .insert([historyData])
      .select();

    if (error) {
      console.error('Error logging stage change:', error);
      throw error;
    } else {
      console.log('Stage change logged successfully for ID:', leadId);
    }
  } catch (error) {
    console.error('Error in logStageChange:', error);
    throw error;
  }
}

async function logLeadUpdated(leadId, updatedFields, updatedBy = 'API') {
  try {
    console.log('Logging lead update for ID:', leadId);
    
    const historyData = {
      record_id: leadId,
      action: 'Lead Updated',
      details: `Lead information updated via ${updatedBy}`,
      additional_info: {
        updated_fields: updatedFields,
        updated_by: updatedBy,
        updated_via: 'API',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('History')
      .insert([historyData])
      .select();

    if (error) {
      console.error('Error logging lead update:', error);
      throw error;
    } else {
      console.log('Lead update logged successfully for ID:', leadId);
    }
  } catch (error) {
    console.error('Error in logLeadUpdated:', error);
    throw error;
  }
}

module.exports = {
  logLeadCreated,
  logStageChange,
  logLeadUpdated
};