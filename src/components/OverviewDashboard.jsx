import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../lib/supabase';
import { useSettingsData } from '../contexts/SettingsDataProvider'; // ← UPDATED: Import settings

const OverviewDashboard = () => {
  // ← UPDATED: Use settings data context with stage_key support
  const { 
    settingsData, 
    getFieldLabel, // ← NEW: For dynamic field labels
    getStageInfo,
    getStageColor,
    getStageScore,
    getStageCategory,
    getStageKeyFromName, // ← NEW: Convert stage name to stage_key
    getStageNameFromKey, // ← NEW: Convert stage_key to stage name
    stageKeyToDataMapping, // ← NEW: Direct stage data mapping
    loading: settingsLoading 
  } = useSettingsData();

  // ALL STATE HOOKS FIRST
  const [leadsData, setLeadsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: '',
    isActive: false
  });

  // ← NEW: Helper functions for stage_key conversion
  const getStageKeyForLead = (stageValue) => {
    // If it's already a stage_key, return it
    if (stageKeyToDataMapping[stageValue]) {
      return stageValue;
    }
    // Otherwise, convert stage name to stage_key
    return getStageKeyFromName(stageValue) || stageValue;
  };

  const getStageDisplayName = (stageValue) => {
    // If it's a stage_key, get the display name
    if (stageKeyToDataMapping[stageValue]) {
      return getStageNameFromKey(stageValue);
    }
    // Otherwise, it's probably already a stage name
    return stageValue;
  };

  // ← UPDATED: Get stage color using stage_key
  const getStageColorFromSettings = (stageValue) => {
    const stageKey = getStageKeyForLead(stageValue);
    return getStageColor(stageKey);
  };

  // ← UPDATED: Get dynamic source colors (can be enhanced with settings later)
  const sourceColors = {
    'Google Ads': '#2A89DD',
    'Instagram': '#F6BD51',
    'Facebook': '#EE6E55',
    'Walk-in': '#647BCA',
    'Website': '#30B2B6',
    'Referral': '#9D91CE',
    'Phone Call': '#8B5CF6',
    'Email': '#F59E0B',
    'Other': '#6B7280',
    'Unknown': '#9D91CE'
  };

  // ← UPDATED: Convert database record to UI format with stage_key support
  const convertDatabaseToUI = (dbRecord) => {
    let meetingDate = '';
    let meetingTime = '';
    let visitDate = '';
    let visitTime = '';

    if (dbRecord.meet_datetime) {
      const meetDateTime = new Date(dbRecord.meet_datetime);
      meetingDate = meetDateTime.toISOString().split('T')[0];
      meetingTime = meetDateTime.toTimeString().slice(0, 5);
    }

    if (dbRecord.visit_datetime) {
      const visitDateTime = new Date(dbRecord.visit_datetime);
      visitDate = visitDateTime.toISOString().split('T')[0];
      visitTime = visitDateTime.toTimeString().slice(0, 5);
    }

    // ← NEW: Handle stage value - could be stage name or stage_key
    const stageValue = dbRecord.stage;
    const stageKey = getStageKeyForLead(stageValue);
    const displayName = getStageDisplayName(stageValue);

    return {
      id: dbRecord.id,
      parentsName: dbRecord.parents_name,
      kidsName: dbRecord.kids_name,
      phone: dbRecord.phone,
      location: dbRecord.location,
      grade: dbRecord.grade,
      stage: stageKey, // ← Store stage_key internally
      stageDisplayName: displayName, // ← Store display name for UI
      score: dbRecord.score,
      category: dbRecord.category,
      counsellor: dbRecord.counsellor,
      offer: dbRecord.offer,
      notes: dbRecord.notes,
      email: dbRecord.email || '',
      occupation: dbRecord.occupation || '',
      source: dbRecord.source || (settingsData?.sources?.[0]?.name || 'Instagram'), // ← UPDATED: Dynamic default source
      currentSchool: dbRecord.current_school || '',
      meetingDate: meetingDate,
      meetingTime: meetingTime,
      meetingLink: dbRecord.meet_link || '',
      visitDate: visitDate,
      visitTime: visitTime,
      visitLocation: dbRecord.visit_location || '',
      registrationFees: dbRecord.reg_fees || '',
      enrolled: dbRecord.enrolled || '',
      stage2_status: dbRecord.stage2_status || '',
      stage3_status: dbRecord.stage3_status || '',
      stage4_status: dbRecord.stage4_status || '',
      stage5_status: dbRecord.stage5_status || '',
      stage6_status: dbRecord.stage6_status || '',
      stage7_status: dbRecord.stage7_status || '',
      stage8_status: dbRecord.stage8_status || '',
      stage9_status: dbRecord.stage9_status || '',
      previousStage: dbRecord.previous_stage || '',
      createdTime: new Date(dbRecord.created_at).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).replace(',', '')
    };
  };

  // Fetch leads function
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Leads')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      console.log('=== OVERVIEW DASHBOARD DATA FETCH ===');
      console.log('Raw data from Supabase:', data);
      const convertedData = data.map(convertDatabaseToUI);
      console.log('Converted data with stage_key:', convertedData);
      setLeadsData(convertedData);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // USEEFFECT AFTER ALL STATE HOOKS
  useEffect(() => {
    fetchLeads();
  }, []);

  // Get current date for max date validation
  const currentDate = new Date().toISOString().split('T')[0];

  // ← UPDATED: Function to normalize source names for display using settings
  const normalizeSourceForDisplay = (source) => {
    // ← NEW: Could be enhanced to use dynamic source settings in the future
    const sourceMap = {
      'Instagram': 'Instagram Ads',
      'Facebook': 'Facebook Ads', 
      'Walk-in': 'Walk-ins',
      'Website': 'Website Enquiry',
      'Google Ads': 'Google Ads',
      'Referral': 'Referral',
      'Phone Call': 'Phone Call',
      'Email': 'Email',
      'Other': 'Other'
    };
    
    return sourceMap[source] || source;
  };

  // ALL USEMEMO HOOKS TOGETHER
  // Filter leads by date range
  const getFilteredLeadsByDate = useMemo(() => {
    if (!Array.isArray(leadsData) || leadsData.length === 0) {
      return [];
    }

    if (!dateRange.isActive || !dateRange.fromDate || !dateRange.toDate) {
      return leadsData;
    }
    
    return leadsData.filter(lead => {
      try {
        // Parse the createdTime which is in format "23 Jul 2025, 14:30:45"
        const leadDate = new Date(lead.createdTime?.replace(/(\d{2}) (\w{3}) (\d{4})/, '$2 $1, $3'));
        const fromDate = new Date(dateRange.fromDate);
        const toDate = new Date(dateRange.toDate);
        toDate.setHours(23, 59, 59, 999); // Include the entire end date
        
        return leadDate >= fromDate && leadDate <= toDate;
      } catch (error) {
        console.error('Error parsing lead date:', lead.createdTime, error);
        return true; // Include lead if date parsing fails
      }
    });
  }, [leadsData, dateRange]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const filteredLeads = getFilteredLeadsByDate;
    
    const counts = {
      allLeads: filteredLeads.length,
      warm: filteredLeads.filter(lead => lead.category === 'Warm').length,
      hot: filteredLeads.filter(lead => lead.category === 'Hot').length,
      cold: filteredLeads.filter(lead => lead.category === 'Cold').length,
      enrolled: filteredLeads.filter(lead => lead.category === 'Enrolled').length
    };
    
    return counts;
  }, [getFilteredLeadsByDate]);

  // ← UPDATED: Calculate source performance data using dynamic sources
  const sourceData = useMemo(() => {
    const filteredLeads = getFilteredLeadsByDate;
    
    const sourceCount = filteredLeads.reduce((acc, lead) => {
      // Handle null, undefined, or empty source values
      let source = lead.source;
      if (!source || source === null || source === undefined || source.trim() === '') {
        source = 'Unknown';
      }
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    const data = Object.entries(sourceCount).map(([name, value]) => {
      const color = sourceColors[name] || '#9D91CE'; // Default fallback color
      const displayName = normalizeSourceForDisplay(name);
      
      return {
        name: displayName,
        originalName: name, // Keep original for reference
        value,
        percentage: filteredLeads.length > 0 ? ((value / filteredLeads.length) * 100).toFixed(1) : 0,
        fill: color // Use 'fill' instead of 'color' for Recharts
      };
    });

    return data;
  }, [getFilteredLeadsByDate]);

  // ← UPDATED: Calculate stage data with stage_key support
  const stageData = useMemo(() => {
    const filteredLeads = getFilteredLeadsByDate;
    const totalLeads = filteredLeads.length;
    
    console.log('=== STAGE DATA CALCULATION ===');
    console.log('Filtered leads:', filteredLeads.length);
    console.log('Settings stages:', settingsData?.stages);
    
    // ← UPDATED: Get dynamic stages from settings with stage_key support
    const dynamicStages = settingsData?.stages?.filter(stage => stage.is_active) || [];
    
    return dynamicStages.map(stageConfig => {
      const stageName = stageConfig.name;
      const stageKey = stageConfig.stage_key || stageName;
      
      console.log(`Processing stage: ${stageName} (key: ${stageKey})`);
      
      // ← UPDATED: Count leads using stage_key comparison
      const count = filteredLeads.filter(lead => {
        const leadStageKey = getStageKeyForLead(lead.stage);
        const matches = leadStageKey === stageKey || lead.stage === stageName;
        
        if (matches) {
          console.log(`  Lead ${lead.id} matches stage ${stageName}`);
        }
        
        return matches;
      }).length;
      
      console.log(`  Final count for ${stageName}: ${count}`);
      
      // Calculate proportional width based on count relative to total leads
      const minWidth = 120;
      const maxWidth = 550;
      const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
      const widthPx = totalLeads > 0 ? 
        minWidth + ((percentage / 100) * (maxWidth - minWidth)) : minWidth;

      return {
        stage: stageName, // ← Display name for UI
        stageKey: stageKey, // ← Store stage_key for reference
        count,
        widthPx,
        color: getStageColorFromSettings(stageKey) // ← NEW: Use stage_key for color lookup
      };
    });
  }, [getFilteredLeadsByDate, settingsData?.stages, getStageColorFromSettings, getStageKeyForLead]);

  // ← UPDATED: Loading check for both data and settings
  if (loading || settingsLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading dashboard...
      </div>
    );
  }

  // Handle date filter submission
  const handleSubmit = () => {
    if (dateRange.fromDate && dateRange.toDate) {
      if (new Date(dateRange.fromDate) <= new Date(dateRange.toDate)) {
        setDateRange(prev => ({ ...prev, isActive: true }));
      } else {
        alert('From date must be before To date');
      }
    } else {
      alert('Please select both From and To dates');
    }
  };

  // Handle clear filter
  const handleClear = () => {
    setDateRange({ fromDate: '', toDate: '', isActive: false });
  };

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="dashboard-pie-tooltip">
          <p className="dashboard-pie-tooltip-title">{data.name}</p>
          <p className="dashboard-pie-tooltip-value">{data.value} leads ({data.percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  // Show loading state if no data
  if (!leadsData || leadsData.length === 0) {
    return (
      <div className="dashboard-no-data">
        <div className="dashboard-no-data-title">No leads data available</div>
        <div className="dashboard-no-data-subtitle">
          Make sure your leads are properly loaded from the database
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      {/* Overview Header */}
      <div className="dashboard-header">
        <h2 className="dashboard-title">Overview</h2>
      </div>

      {/* Date Filter Section */}
      <div className="dashboard-date-filter">
        <span className="dashboard-date-filter-label">Select Date</span>
        
        <div className="dashboard-date-input-group">
          <label className="dashboard-date-label">From</label>
          <input
            type="date"
            value={dateRange.fromDate}
            max={currentDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
            className="dashboard-date-input"
          />
        </div>

        <div className="dashboard-date-input-group">
          <label className="dashboard-date-label">To</label>
          <input
            type="date"
            value={dateRange.toDate}
            max={currentDate}
            min={dateRange.fromDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
            className="dashboard-date-input"
          />
        </div>

        <button onClick={handleSubmit} className="dashboard-submit-btn">
          Submit
        </button>

        {dateRange.isActive && (
          <button onClick={handleClear} className="dashboard-clear-btn">
            Clear Filter
          </button>
        )}
      </div>

      {/* Category Cards */}
      <div className="dashboard-category-grid">
        <div className="dashboard-category-card">
          <div className="dashboard-category-label">All Leads</div>
          <div className="dashboard-category-count dashboard-category-count-all">
            {categoryCounts.allLeads}
          </div>
        </div>

        <div className="dashboard-category-card">
          <div className="dashboard-category-label">Warm</div>
          <div className="dashboard-category-count dashboard-category-count-warm">
            {categoryCounts.warm}
          </div>
        </div>

        <div className="dashboard-category-card">
          <div className="dashboard-category-label">Hot</div>
          <div className="dashboard-category-count dashboard-category-count-hot">
            {categoryCounts.hot}
          </div>
        </div>

        <div className="dashboard-category-card">
          <div className="dashboard-category-label">Cold</div>
          <div className="dashboard-category-count dashboard-category-count-cold">
            {categoryCounts.cold}
          </div>
        </div>

        <div className="dashboard-category-card">
          <div className="dashboard-category-label">Enrolled</div>
          <div className="dashboard-category-count dashboard-category-count-enrolled">
            {categoryCounts.enrolled}
          </div>
        </div>
      </div>

      {/* Charts Section - Two Columns */}
      <div className="dashboard-charts-grid">
        {/* Source Performance Chart */}
        <div className="dashboard-chart-container">
          <h3 className="dashboard-chart-title">
            {getFieldLabel('source') || 'Source'} Performance {/* ← NEW: Dynamic field label */}
          </h3>
          
          {sourceData.length > 0 ? (
            <>
              <div className="dashboard-pie-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={100}
                      paddingAngle={1}
                      dataKey="value"
                      label={({ name, percentage }) => {
                        // Only show label if percentage is significant enough
                        if (parseFloat(percentage) > 8) {
                          return `${name}`;
                        }
                        return '';
                      }}
                      labelLine={false}
                      style={{ fontSize: '12px', fontWeight: '500' }}
                    >
                      {sourceData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fill} 
                          stroke="#ffffff" 
                          strokeWidth={2} 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Source Legend */}
              <div className="dashboard-source-legend">
                {sourceData.map((source, index) => (
                  <div key={index} className="dashboard-source-legend-item">
                    {/* Color indicator */}
                    <div 
                      className="dashboard-source-color-indicator"
                      style={{ backgroundColor: source.fill }}
                    ></div>
                    <div className="dashboard-source-name">{source.name}</div>
                    <div className="dashboard-source-stats">
                      <span>{source.value}</span> 
                      <span>{source.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="dashboard-chart-empty">
              <div>No source data available</div>
              {/* Test with sample data */}
              <div className="dashboard-sample-chart">
                <ResponsiveContainer width={250} height={150}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Google Ads', value: 132, color: '#2A89DD' },
                        { name: 'Instagram Ads', value: 60, color: '#F6BD51' },
                        { name: 'Facebook Ads', value: 35, color: '#EE6E55' },
                        { name: 'Walk-ins', value: 18, color: '#647BCA' },
                        { name: 'Website Enquiry', value: 9, color: '#30B2B6' },
                        { name: 'Referral', value: 42, color: '#9D91CE' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                    >
                      {[
                        { name: 'Google Ads', value: 132, color: '#2A89DD' },
                        { name: 'Instagram Ads', value: 60, color: '#F6BD51' },
                        { name: 'Facebook Ads', value: 35, color: '#EE6E55' },
                        { name: 'Walk-ins', value: 18, color: '#647BCA' },
                        { name: 'Website Enquiry', value: 9, color: '#30B2B6' },
                        { name: 'Referral', value: 42, color: '#9D91CE' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dashboard-sample-text">
                  Sample chart (will show when data is available)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stages Section */}
        <div className="dashboard-stages-container">
          <div className="dashboard-stages-header">
            <h3 className="dashboard-stages-title">
              {getFieldLabel('stage') || 'Stages'} {/* ← NEW: Dynamic field label */}
            </h3>
            <div className="dashboard-total-leads-badge" style={{paddingBottom:'15px'}}>
              Total Leads: {categoryCounts.allLeads}
            </div>
          </div>
          
          {getFilteredLeadsByDate.length > 0 ? (
            <div className="dashboard-stages-list">
              {stageData.map(({ stage, stageKey, count, widthPx, color }) => (
                <div key={stageKey || stage} className="dashboard-stage-item">
                  <div 
                    className="dashboard-stage-bar" 
                    style={{ 
                      backgroundColor: color,
                      width: `${widthPx}px`,
                      maxWidth: '550px',
                      minWidth: '120px'
                    }}
                  >
                    <span className="dashboard-stage-label">{stage}</span> {/* ← Display stage name */}
                  </div>
                  <span className="dashboard-stage-count">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-stages-empty">
              No stage data available
            </div>
          )}
        </div>
      </div>

      {/* Date Range Info */}
      {dateRange.isActive && (
        <div className="dashboard-date-info">
          Showing data from {dateRange.fromDate} to {dateRange.toDate}
        </div>
      )}
    </div>
  );
};

export default OverviewDashboard;