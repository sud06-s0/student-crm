import React, { useState } from 'react';

const Stage2ActionButton = ({ 
  leadId, 
  currentStatus, 
  onStatusUpdate, 
  getFieldLabel, // ← Field_key aware label function
  parentsName, 
  meetingDate, 
  meetingTime, 
  meetingLink,
  phone 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showHover, setShowHover] = useState(false);

  // ← UPDATED: Function to validate required parameters with field_key support
  const validateParameters = () => {
    const missingParams = [];
    
    if (!parentsName || parentsName.trim() === '') {
      missingParams.push(getFieldLabel('parentsName')); // ← Dynamic field label
    }
    if (!meetingDate || meetingDate.trim() === '') {
      missingParams.push(getFieldLabel('meetingDate')); // ← Dynamic field label
    }
    if (!meetingTime || meetingTime.trim() === '') {
      missingParams.push(getFieldLabel('meetingTime')); // ← Dynamic field label
    }
    if (!meetingLink || meetingLink.trim() === '') {
      missingParams.push(getFieldLabel('meetingLink')); // ← Dynamic field label
    }
    if (!phone || phone.trim() === '') {
      missingParams.push(getFieldLabel('phone')); // ← Dynamic field label
    }
    return missingParams;
  };

  const handleClick = async () => {
    // Validate parameters before proceeding
    const missingParams = validateParameters();
    
    if (missingParams.length > 0) {
      alert(`Cannot send message. The following required information is missing:\n\n${missingParams.join('\n')}\n\nPlease update the lead information and try again.`);
      return; // Stop execution, no API call
    }

    setIsLoading(true);
    try {
      // ← API call to send WhatsApp message (unchanged - working correctly)
      const response = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MGYyOGY2ZTBjYzg1MGMwMmMzNGJiOCIsIm5hbWUiOiJXRUJVWlogRGlnaXRhbCBQcml2YXRlIExpbWl0ZWQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjgwZjI4ZjZlMGNjODUwYzAyYzM0YmIzIiwiYWN0aXZlUGxhbiI6IkZSRUVfRk9SRVZFUiIsImlhdCI6MTc0NTgyMzk5MH0.pJi8qbYf3joYbNm5zSs4gJKFlBFsCS6apvkBkw4Qdxs',
          campaignName: 'Meeting-agenda-1',
          destination: phone,
          userName: parentsName,
          templateParams: [parentsName, meetingDate, meetingTime, meetingLink]
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('API Response:', result);

      // Update parent component - let sidebar handle database
      if (onStatusUpdate) {
        onStatusUpdate('stage2_status', 'SENT');
      }

      console.log('Stage 2 (Connected) action completed');
      
    } catch (error) {
      console.error('Error updating Stage 2 status:', error);
      alert('Error updating Stage 2 status: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ← Hover message showing template preview (not actual field labels)
  const hoverMessage = `Hey Name, our Meeting is confirmed for Date at Time. Here's the Link to join: LinkMessage

Here's the agenda:  
Agenda 1
Agenda2

Looking forward to our call.`;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={handleClick} 
        disabled={isLoading}
        onMouseEnter={() => setShowHover(true)}
        onMouseLeave={() => setShowHover(false)}
        style={{ 
          padding: '8px 16px', 
          backgroundColor: currentStatus === 'SENT' ? '#787677' : '#6b7280', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          fontSize: '14px', 
          fontWeight: '500', 
          cursor: isLoading ? 'not-allowed' : 'pointer', 
          minWidth: '60px', 
          opacity: isLoading ? 0.7 : 1,
          transition: 'all 0.2s ease'
        }} 
      >
        {isLoading ? '...' : 'Send'}
      </button>

      {/* Hover tooltip */}
      {showHover && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#333',
          color: 'white',
          padding: '10px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          whiteSpace: 'pre-line',
          zIndex: 1000,
          marginBottom: '5px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          width: '600px',
          lineHeight: '1.4'
        }}>
          {hoverMessage}
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #333'
          }}></div>
        </div>
      )}
    </div>
  );
};

export default Stage2ActionButton;