import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const OverviewDashboard = ({ leadsData = [] }) => {
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: '',
    isActive: false
  });

  // Stage colors mapping
  const stageColors = {
    'New Lead': '#B3D7FF',
    'Connected': '#E9FF9A',
    'Meeting Booked': '#FFEC9F',
    'Meeting Done': '#FF9697',
    'Proposal Sent': '#FFC796',
    'Visit Booked': '#D1A4FF',
    'Visit Done': '#B1FFFF',
    'Registered': '#FFCCF5',
    'Admission': '#98FFB4',
    'No Response': '#B5BAB1'
  };

  // Updated source colors mapping to match form values
  const sourceColors = {
    'Google Ads': '#2A89DD',       // Form: "Google Ads" -> Chart: "Google Ads"
    'Instagram': '#F6BD51',        // Form: "Instagram" -> Chart: "Instagram Ads"  
    'Facebook': '#EE6E55',         // Form: "Facebook" -> Chart: "Facebook Ads"
    'Walk-in': '#647BCA',          // Form: "Walk-in" -> Chart: "Walk-ins"
    'Website': '#30B2B6',          // Form: "Website" -> Chart: "Website Enquiry"
    'Referral': '#9D91CE',         // Form: "Referral" -> Chart: "Referral"
    'Phone Call': '#8B5CF6',       // Form: "Phone Call" -> Chart: "Phone Call"
    'Email': '#F59E0B',            // Form: "Email" -> Chart: "Email"
    'Other': '#6B7280',            // Form: "Other" -> Chart: "Other"
    'Unknown': '#9D91CE'           // Fallback for null/undefined values
  };

  // Function to normalize source names for display
  const normalizeSourceForDisplay = (source) => {
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

  // Get current date for max date validation
  const currentDate = new Date().toISOString().split('T')[0];

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

  // Calculate source performance data
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
          <h3 className="dashboard-chart-title">Source Performance</h3>
          
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
          <h3 className="dashboard-stages-title">Stages</h3>
          
          {getFilteredLeadsByDate.length > 0 ? (
            <div className="dashboard-stages-list">
              {[
                'New Lead', 'Connected', 'Meeting Booked', 'Meeting Done', 
                'Proposal Sent', 'Visit Booked', 'Visit Done', 'Registered', 'Admission'
              ].map(stage => {
                const filteredLeads = getFilteredLeadsByDate;
                const count = filteredLeads.filter(lead => lead.stage === stage).length;
                
                // Simple width calculation
                const widthPercentage = count === 0 ? 25 : count === 1 ? 50 : 100;
                
                return (
                  <div key={stage} className="dashboard-stage-item">
                    <div 
                        className="dashboard-stage-bar" 
                        style={{ 
                        backgroundColor: stageColors[stage],
                        width: widthPercentage + '%'
                        }}
                    >
                        <span className="dashboard-stage-label">{stage}</span>
                    </div>
                    <span className="dashboard-stage-count">{count}</span>
                    </div>
                );
              })}
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