import React, { createContext, useContext, useState, useCallback } from 'react';

// Create the context
const LeadStateContext = createContext();

// Custom hook to use the lead state
const useLeadState = () => {
  const context = useContext(LeadStateContext);
  if (!context) {
    throw new Error('useLeadState must be used within a LeadStateProvider');
  }
  return context;
};

// LeadStateProvider component
const LeadStateProvider = ({ children }) => {
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadsData, setLeadsData] = useState([]);

  // Update a specific lead in the leadsData array
  const updateLeadInList = useCallback((leadId, updatedFields) => {
    setLeadsData(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId 
          ? { ...lead, ...updatedFields }
          : lead
      )
    );
  }, []);

  // Update the selected lead
  const updateSelectedLead = useCallback((updatedFields) => {
    setSelectedLead(prevLead => 
      prevLead ? { ...prevLead, ...updatedFields } : null
    );
  }, []);

  // Update both selected lead and the lead in the list
  const updateLead = useCallback((leadId, updatedFields) => {
    // Update in the leads list
    updateLeadInList(leadId, updatedFields);
    
    // Update selected lead if it matches
    if (selectedLead && selectedLead.id === leadId) {
      updateSelectedLead(updatedFields);
    }
  }, [selectedLead, updateLeadInList, updateSelectedLead]);

  // ← UPDATED: Handle action status updates with field_key awareness
  const updateActionStatus = useCallback((leadId, stageField, newStatus) => {
    const updateFields = { [stageField]: newStatus };
    updateLead(leadId, updateFields);
  }, [updateLead]);

  // ← UPDATED: Handle complete lead updates with field_key and stage_key support
  const updateCompleteLeadData = useCallback((leadId, formData, getScoreFromStage, getCategoryFromStage, getStageKeyFromName, getStageDisplayName) => {
    // Format phone number properly
    let formattedPhone = formData.phone;
    if (formattedPhone && !formattedPhone.startsWith('+91')) {
      formattedPhone = formattedPhone.replace(/^\+91/, '');
      formattedPhone = `+91${formattedPhone}`;
    }

    // ← NEW: Handle stage_key conversion
    let stageKey = formData.stage;
    let stageDisplayName = formData.stage;

    if (getStageKeyFromName && getStageDisplayName) {
      // If stage is a display name, convert to stage_key
      const convertedStageKey = getStageKeyFromName(formData.stage);
      if (convertedStageKey) {
        stageKey = convertedStageKey;
        stageDisplayName = getStageDisplayName(stageKey);
      } else {
        // It's already a stage_key, get display name
        stageDisplayName = getStageDisplayName(formData.stage);
      }
    }

    // ← UPDATED: Complete field mapping with field_key support
    const updatedFields = {
      // ← Core identity fields (field_key: parentsName, kidsName, phone, email)
      parentsName: formData.parentsName,
      kidsName: formData.kidsName, 
      phone: formattedPhone,
      email: formData.email,

      // ← Basic lead fields (field_key: grade, source, counsellor)  
      grade: formData.grade,
      source: formData.source,
      counsellor: formData.counsellor,

      // ← Stage handling with stage_key support
      stage: stageKey, // ← Store stage_key internally
      stageDisplayName: stageDisplayName, // ← Store display name for UI

      // ← Additional info fields (field_key: occupation, location, currentSchool, offer)
      occupation: formData.occupation,
      location: formData.location,
      currentSchool: formData.currentSchool,
      offer: formData.offer,

      // ← Meeting fields (field_key: meetingDate, meetingTime, meetingLink)
      meetingDate: formData.meetingDate,
      meetingTime: formData.meetingTime,
      meetingLink: formData.meetingLink,

      // ← Visit fields (field_key: visitDate, visitTime, visitLocation)
      visitDate: formData.visitDate,
      visitTime: formData.visitTime,
      visitLocation: formData.visitLocation,

      // ← Admission fields (field_key: registrationFees, enrolled)
      registrationFees: formData.registrationFees,
      enrolled: formData.enrolled,

      // ← Additional fields (field_key: notes)
      notes: formData.notes, // ← NEW: Added notes field support

      // ← Dynamic scoring using stage_key
      score: getScoreFromStage ? getScoreFromStage(stageKey) : 20,
      category: getCategoryFromStage ? getCategoryFromStage(stageKey) : 'New'
    };

    console.log('=== LEAD STATE UPDATE ===');
    console.log('Lead ID:', leadId);
    console.log('Form Data:', formData);
    console.log('Stage Key:', stageKey);
    console.log('Stage Display Name:', stageDisplayName);
    console.log('Updated Fields:', updatedFields);

    updateLead(leadId, updatedFields);
  }, [updateLead]);

  // ← NEW: Handle field value updates with field_key awareness
  const updateLeadField = useCallback((leadId, fieldKey, fieldValue, fieldLabel) => {
    console.log('=== FIELD UPDATE ===');
    console.log(`Updating field ${fieldKey} (${fieldLabel}) to:`, fieldValue);
    
    const updateFields = { [fieldKey]: fieldValue };
    updateLead(leadId, updateFields);
  }, [updateLead]);

  // ← NEW: Handle stage updates with stage_key support
  const updateLeadStage = useCallback((leadId, stageKey, getScoreFromStage, getCategoryFromStage, getStageDisplayName) => {
    console.log('=== STAGE UPDATE ===');
    console.log(`Updating lead ${leadId} stage to:`, stageKey);
    
    const stageDisplayName = getStageDisplayName ? getStageDisplayName(stageKey) : stageKey;
    const score = getScoreFromStage ? getScoreFromStage(stageKey) : 20;
    const category = getCategoryFromStage ? getCategoryFromStage(stageKey) : 'New';

    const updateFields = {
      stage: stageKey,
      stageDisplayName: stageDisplayName,
      score: score,
      category: category
    };

    console.log('Stage update fields:', updateFields);
    updateLead(leadId, updateFields);
  }, [updateLead]);

  // ← NEW: Batch update multiple fields with field_key support
  const updateLeadFields = useCallback((leadId, fieldsObject, fieldMappings) => {
    console.log('=== BATCH FIELD UPDATE ===');
    console.log('Lead ID:', leadId);
    console.log('Fields Object:', fieldsObject);
    console.log('Field Mappings:', fieldMappings);

    // Convert display names to field keys if mappings provided
    const updateFields = {};
    
    Object.entries(fieldsObject).forEach(([key, value]) => {
      // Check if this is a display name that needs conversion
      if (fieldMappings && fieldMappings[key]) {
        const fieldKey = fieldMappings[key];
        updateFields[fieldKey] = value;
        console.log(`Mapped "${key}" → "${fieldKey}": ${value}`);
      } else {
        // Use as-is (probably already a field key)
        updateFields[key] = value;
        console.log(`Direct field "${key}": ${value}`);
      }
    });

    console.log('Final update fields:', updateFields);
    updateLead(leadId, updateFields);
  }, [updateLead]);

  const value = {
    // State
    selectedLead,
    leadsData,
    
    // Setters
    setSelectedLead,
    setLeadsData,
    
    // ← EXISTING: Update functions
    updateLead,
    updateActionStatus,
    updateCompleteLeadData,
    updateSelectedLead,
    updateLeadInList,

    // ← NEW: Field_key and stage_key aware update functions
    updateLeadField,        // Update single field with field_key awareness
    updateLeadStage,        // Update stage with stage_key support  
    updateLeadFields        // Batch update with field_key mapping
  };

  return (
    <LeadStateContext.Provider value={value}>
      {children}
    </LeadStateContext.Provider>
  );
};

export default LeadStateProvider;
export {useLeadState};