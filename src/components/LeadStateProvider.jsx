import React, { createContext, useContext, useState, useCallback } from 'react';

// Create the context
const LeadStateContext = createContext();

// Custom hook to use the lead state
export const useLeadState = () => {
  const context = useContext(LeadStateContext);
  if (!context) {
    throw new Error('useLeadState must be used within a LeadStateProvider');
  }
  return context;
};

// LeadStateProvider component
export const LeadStateProvider = ({ children }) => {
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

  // Handle action status updates specifically
  const updateActionStatus = useCallback((leadId, stageField, newStatus) => {
    const updateFields = { [stageField]: newStatus };
    updateLead(leadId, updateFields);
  }, [updateLead]);

  // Handle complete lead updates (from sidebar form)
  const updateCompleteLeadData = useCallback((leadId, formData) => {
    // Format phone number properly
    let formattedPhone = formData.phone;
    if (formattedPhone && !formattedPhone.startsWith('+91')) {
      formattedPhone = formattedPhone.replace(/^\+91/, '');
      formattedPhone = `+91${formattedPhone}`;
    }

    const updatedFields = {
      parentsName: formData.parentsName,
      kidsName: formData.kidsName,
      grade: formData.grade,
      source: formData.source,
      phone: formattedPhone,
      email: formData.email,
      occupation: formData.occupation,
      location: formData.location,
      currentSchool: formData.currentSchool,
      meetingDate: formData.meetingDate,
      meetingTime: formData.meetingTime,
      meetingLink: formData.meetingLink,
      visitDate: formData.visitDate,
      visitTime: formData.visitTime,
      visitLocation: formData.visitLocation,
      registrationFees: formData.registrationFees,
      enrolled: formData.enrolled,
      stage: formData.stage,
      // Add score and category based on stage
      score: getScoreFromStage(formData.stage),
      category: getCategoryFromStage(formData.stage)
    };

    updateLead(leadId, updatedFields);
  }, [updateLead]);

  // Helper functions for score and category (duplicated here for independence)
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

  const value = {
    // State
    selectedLead,
    leadsData,
    
    // Setters
    setSelectedLead,
    setLeadsData,
    
    // Update functions
    updateLead,
    updateActionStatus,
    updateCompleteLeadData,
    updateSelectedLead,
    updateLeadInList,
    
    // Helper functions
    getScoreFromStage,
    getCategoryFromStage
  };

  return (
    <LeadStateContext.Provider value={value}>
      {children}
    </LeadStateContext.Provider>
  );
};

export default LeadStateProvider;