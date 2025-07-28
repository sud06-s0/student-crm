import React, { useState, useEffect, useRef } from 'react';

const Stage1ActionButton = ({ 
  leadData,
  onComplete,
  getFieldLabel // ← NEW: Field_key aware label function (optional for this component)
}) => {
  console.log('🔵 Stage1ActionButton component rendered!');
  console.log('🔵 leadData received:', leadData);
  
  const [isLoading, setIsLoading] = useState(false);
  const hasCalledApi = useRef(false); // Add this to track if API was already called

  // ← NEW: Optional validation function with field_key support
  const validateParameters = () => {
    if (!getFieldLabel) {
      // If no getFieldLabel function provided, use default validation
      return [];
    }

    const missingParams = [];
    
    if (!leadData?.phone || leadData.phone.trim() === '') {
      missingParams.push(getFieldLabel('phone'));
    }
    if (!leadData?.parentsName || leadData.parentsName.trim() === '') {
      missingParams.push(getFieldLabel('parentsName'));
    }
    if (!leadData?.kidsName || leadData.kidsName.trim() === '') {
      missingParams.push(getFieldLabel('kidsName'));
    }
    if (!leadData?.grade || leadData.grade.trim() === '') {
      missingParams.push(getFieldLabel('grade'));
    }
    
    return missingParams;
  };

  const handleApiCall = async () => {
  // Prevent duplicate calls
  if (hasCalledApi.current) {
    console.log('🟡 API call already made, skipping...');
    return;
  }

  // ← NEW: Optional validation check with field_key support
  const missingParams = validateParameters();
  if (missingParams.length > 0) {
    console.log('🔴 Missing required parameters:', missingParams);
    if (onComplete) {
      onComplete(false, `Missing required information: ${missingParams.join(', ')}`);
    }
    return;
  }
  
  console.log('🟡 handleApiCall started');
  hasCalledApi.current = true; // ← MOVED: Mark as called AFTER validation passes
  setIsLoading(true);
    
    try {
      console.log('🟡 Making API call with data:', {
        phone: leadData.phone,
        parentsName: leadData.parentsName,
        kidsName: leadData.kidsName,
        grade: leadData.grade
      });

      // ← API call for new lead (Stage 1) - unchanged, working correctly
      const response = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MGYyOGY2ZTBjYzg1MGMwMmMzNGJiOCIsIm5hbWUiOiJXRUJVWlogRGlnaXRhbCBQcml2YXRlIExpbWl0ZWQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjgwZjI4ZjZlMGNjODUwYzAyYzM0YmIzIiwiYWN0aXZlUGxhbiI6IkZSRUVfRk9SRVZFUiIsImlhdCI6MTc0NTgyMzk5MH0.pJi8qbYf3joYbNm5zSs4gJKFlBFsCS6apvkBkw4Qdxs',
          campaignName: 'welcome-school',
          destination: leadData.phone,
          userName: leadData.parentsName,
          templateParams: [leadData.parentsName, leadData.kidsName, leadData.grade]
        })
      });

      console.log('🟡 API response status:', response.status);

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('🟢 Stage 1 API Response:', result);

      // Notify parent component that API call completed
      if (onComplete) {
        onComplete(true);
      }

    } catch (error) {
      console.error('🔴 Error in Stage 1 API call:', error);
      
      // Still notify completion (don't fail the lead creation due to API error)
      if (onComplete) {
        onComplete(false, error.message);
      }
    } finally {
      setIsLoading(false);
      console.log('🟡 handleApiCall finished');
    }
  };

  // ← This component auto-triggers the API call when mounted
  useEffect(() => {
    console.log('🔵 useEffect triggered!');
    if (leadData && !hasCalledApi.current) { // Add the hasCalledApi check
      console.log('🔵 leadData exists and API not called yet, calling handleApiCall');
      handleApiCall();
    } else {
      console.log('🔴 No leadData found or API already called!');
    }
  }, [leadData]);

  

  console.log('🔵 Stage1ActionButton returning (invisible)');
  // Return nothing (invisible component)
  return null;
};

export default Stage1ActionButton;