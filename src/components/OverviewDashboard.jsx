import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../lib/supabase';

const OverviewDashboard = () => {
  // ALL STATE HOOKS FIRST
  const [leadsData, setLeadsData] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Convert database record to UI format
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

    return {
      id: dbRecord.id,
      parentsName: dbRecord.parents_name,
      kidsName: dbRecord.kids_name,
      phone: dbRecord.phone,
      location: dbRecord.location,
      grade: dbRecord.grade,
      stage: dbRecord.stage,
      score: dbRecord.score,
      category: dbRecord.category,
      counsellor: dbRecord.counsellor,
      offer: dbRecord.offer,
      notes: dbRecord.notes,
      email: dbRecord.email || '',
      occupation: dbRecord.occupation || '',
      source: dbRecord.source || 'Instagram',
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

      const convertedData = data.map(convertDatabaseToUI);
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

  // Calculate stage data with proportional widths
  const stageData = useMemo(() => {
    const filteredLeads = getFilteredLeadsByDate;
    const totalLeads = filteredLeads.length;
    const maxBarWidth = 350; // Maximum bar width in pixels
    
    const stages = [
      'New Lead', 'Connected', 'Meeting Booked', 'Meeting Done', 
      'Proposal Sent', 'Visit Booked', 'Visit Done', 'Registered', 'Admission'
    ];
    
    return stages.map(stage => {
      const count = filteredLeads.filter(lead => lead.stage === stage).length;
      // Calculate proportional width based on count relative to total leads
        const minWidth = 120;
        const maxWidth = 350;
        const normalizedValue = Math.sqrt(count / totalLeads);
        const widthPx = totalLeads > 0 ? 
          minWidth + (normalizedValue * (maxWidth - minWidth)) : minWidth;
      
      return {
        stage,
        count,
        widthPx,
        color: stageColors[stage]
      };
    });
  }, [getFilteredLeadsByDate, stageColors]);

  // LOADING CHECK AFTER ALL HOOKS
  if (loading) {
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
          <div className="dashboard-stages-header">
            <h3 className="dashboard-stages-title">Stages</h3>
            <div className="dashboard-total-leads-badge" style={{paddingBottom:'15px'}}>
              Total Leads: {categoryCounts.allLeads}
            </div>
          </div>
          
          {getFilteredLeadsByDate.length > 0 ? (
            <div className="dashboard-stages-list">
              {stageData.map(({ stage, count, widthPx, color }) => (
                <div key={stage} className="dashboard-stage-item">
                  <div 
                    className="dashboard-stage-bar" 
                    style={{ 
                      backgroundColor: color,
                      width: `${widthPx}px`,
                      maxWidth: '350px',
                      minWidth: '120px'
                    }}
                  >
                    <span className="dashboard-stage-label">{stage}</span>
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