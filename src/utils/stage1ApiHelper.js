// utils/stage1ApiHelper.js
// Extract the API logic from Stage1ActionButton component for reuse

export const triggerStage1API = async (leadData) => {
  try {
    console.log('🟡 Triggering Stage 1 API for:', {
      phone: leadData.phone,
      parentsName: leadData.parentsName,
      kidsName: leadData.kidsName,
      grade: leadData.grade
    });

    // Validate required parameters
    if (!leadData.phone || !leadData.parentsName || !leadData.kidsName || !leadData.grade) {
      console.log('🔴 Missing required parameters for Stage 1 API');
      return { success: false, error: 'Missing required parameters' };
    }

    // Clean phone number (remove +91 if present)
    const cleanPhone = leadData.phone.replace(/^\+91/, '').replace(/\D/g, '');

    const response = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MGYyOGY2ZTBjYzg1MGMwMmMzNGJiOCIsIm5hbWUiOiJXRUJVWlogRGlnaXRhbCBQcml2YXRlIExpbWl0ZWQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjgwZjI4ZjZlMGNjODUwYzAyYzM0YmIzIiwiYWN0aXZlUGxhbiI6IkZSRUVfRk9SRVZFUiIsImlhdCI6MTc0NTgyMzk5MH0.pJi8qbYf3joYbNm5zSs4gJKFlBFsCS6apvkBkw4Qdxs',
        campaignName: 'welcome-school',
        destination: cleanPhone,
        userName: leadData.parentsName,
        templateParams: [leadData.parentsName, leadData.kidsName, leadData.grade]
      })
    });

    console.log('🟡 Stage 1 API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔴 Stage 1 API error:', errorText);
      return { success: false, error: `API call failed: ${response.status} - ${errorText}` };
    }

    const result = await response.json();
    console.log('🟢 Stage 1 API Success:', result);

    return { success: true, data: result };

  } catch (error) {
    console.error('🔴 Error in Stage 1 API call:', error);
    return { success: false, error: error.message };
  }
};