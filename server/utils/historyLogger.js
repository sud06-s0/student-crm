// server/utils/historyLogger.js
const { supabase } = require('../config/supabase');

// Log lead creation
const logLeadCreated = async (leadId, formData) => {
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
    throw error; // Re-throw so calling function knows it failed
  }
};

// Log stage change (if needed in future)
const logStageChange = async (leadId, oldStage, newStage, source = 'API') => {
  try {
    console.log('Logging stage change for ID:', leadId);
    
    const historyData = {
      record_id: leadId,
      action: 'Stage Changed',
      details: `Stage changed from "${oldStage}" to "${newStage}" via ${source}`,
      additional_info: {
        oldStage: oldStage,
        newStage: newStage,
        source: source,
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
};

// Log field update (if needed in future)
const logFieldUpdate = async (leadId, fieldName, oldValue, newValue, source = 'API') => {
  try {
    console.log('Logging field update for ID:', leadId);
    
    const historyData = {
      record_id: leadId,
      action: 'Field Updated',
      details: `${fieldName} changed from "${oldValue}" to "${newValue}" via ${source}`,
      additional_info: {
        fieldName: fieldName,
        oldValue: oldValue,
        newValue: newValue,
        source: source,
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
      console.error('Error logging field update:', error);
      throw error;
    } else {
      console.log('Field update logged successfully for ID:', leadId);
    }
  } catch (error) {
    console.error('Error in logFieldUpdate:', error);
    throw error;
  }
};

// Log API activity (general purpose)
const logApiActivity = async (leadId, action, details, additionalInfo = {}) => {
  try {
    console.log('Logging API activity for ID:', leadId);
    
    const historyData = {
      record_id: leadId,
      action: action,
      details: details,
      additional_info: {
        ...additionalInfo,
        logged_via: 'API',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('History')
      .insert([historyData])
      .select();

    if (error) {
      console.error('Error logging API activity:', error);
      throw error;
    } else {
      console.log('API activity logged successfully for ID:', leadId);
    }
  } catch (error) {
    console.error('Error in logApiActivity:', error);
    throw error;
  }
};

// Test history logging function
const testHistoryLog = async () => {
  try {
    const testData = {
      record_id: 0, // Test record
      action: 'API Test',
      details: 'Testing history logging functionality',
      additional_info: {
        test: true,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('History')
      .insert([testData])
      .select();

    if (error) {
      console.error('History logging test failed:', error);
      return false;
    } else {
      console.log('History logging test successful:', data);
      return true;
    }
  } catch (error) {
    console.error('Error in testHistoryLog:', error);
    return false;
  }
};

module.exports = {
  logLeadCreated,
  logStageChange,
  logFieldUpdate,
  logApiActivity,
  testHistoryLog
};