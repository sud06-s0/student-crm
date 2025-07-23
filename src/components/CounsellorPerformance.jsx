import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../lib/supabase';
import { 
  GraduationCap, 
  Trophy,
  Users,
  BarChart3
} from 'lucide-react';
import LeftSidebar from './LeftSidebar';

// Import your custom icons
import meetingsDoneIcon from '../assets/icons/meetings-done.png';
import visitsDoneIcon from '../assets/icons/visits-done.png';
import registeredIcon from '../assets/icons/registered.png';
import enrolledIcon from '../assets/icons/enrolled.png';
import topPerformerIcon from '../assets/icons/top-performer.png'; // Add this line

const CounsellorPerformance = () => {
  // ALL STATE HOOKS FIRST
  const [leadsData, setLeadsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: '',
    isActive: false
  });
  const [selectedMetric, setSelectedMetric] = useState('enrolled');

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

  // Calculate counsellor performance data
  const counsellorData = useMemo(() => {
    const filteredLeads = getFilteredLeadsByDate;
    
    const counsellorStats = filteredLeads.reduce((acc, lead) => {
      const counsellor = lead.counsellor || 'Unknown';
      
      if (!acc[counsellor]) {
        acc[counsellor] = {
          totalLeads: 0,
          meetingsDone: 0,
          visitsDone: 0,
          registered: 0,
          enrolled: 0
        };
      }
      
      acc[counsellor].totalLeads++;
      
      // Count based on stage progression
      if (['Meeting Done', 'Proposal Sent', 'Visit Booked', 'Visit Done', 'Registered', 'Admission'].includes(lead.stage)) {
        acc[counsellor].meetingsDone++;
      }
      
      if (['Visit Done', 'Registered', 'Admission'].includes(lead.stage)) {
        acc[counsellor].visitsDone++;
      }
      
      if (['Registered', 'Admission'].includes(lead.stage)) {
        acc[counsellor].registered++;
      }
      
      if (lead.stage === 'Admission' || lead.category === 'Enrolled') {
        acc[counsellor].enrolled++;
      }
      
      return acc;
    }, {});

    // Convert to array and calculate conversion rates
    return Object.entries(counsellorStats).map(([name, stats]) => ({
      name,
      ...stats,
      conversionRate: stats.totalLeads > 0 ? ((stats.enrolled / stats.totalLeads) * 100).toFixed(0) : 0
    })).sort((a, b) => b.conversionRate - a.conversionRate);
  }, [getFilteredLeadsByDate]);

  // Get top performer
  const topPerformer = useMemo(() => {
    if (counsellorData.length === 0) return null;
    return counsellorData[0];
  }, [counsellorData]);

  // Prepare bar chart data
  const barChartData = useMemo(() => {
    return counsellorData.map(counsellor => ({
      name: counsellor.name.split(' ')[0],
      value: counsellor[selectedMetric],
      fullName: counsellor.name,
      metric: selectedMetric
    }));
  }, [counsellorData, selectedMetric]);

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
        Loading counsellor performance...
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

  // Get counsellor initials
  const getCounsellorInitials = (fullName) => {
    if (!fullName) return 'NA';
    const words = fullName.trim().split(' ');
    const firstTwoWords = words.slice(0, 2);
    return firstTwoWords.map(word => word.charAt(0).toUpperCase()).join('');
  };

  // Custom tooltip for bar chart
  const BarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="dashboard-pie-tooltip">
          <p className="dashboard-pie-tooltip-title">{data.fullName}</p>
          <p className="dashboard-pie-tooltip-value">{data.value} {data.metric.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
        </div>
      );
    }
    return null;
  };

  // Show loading state if no data
  if (!leadsData || leadsData.length === 0) {
    return (
      <div className="nova-crm" style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* Left Sidebar */}
        <LeftSidebar 
          activeNavItem="counsellor"
          activeSubmenuItem=""
          stages={[]}
          getStageCount={() => 0}
          stagesTitle="Performance"
          stagesIcon={BarChart3}
        />

        {/* Main Content */}
        <div className="nova-main">
          <div className="dashboard-no-data">
            <div className="dashboard-no-data-title">No leads data available</div>
            <div className="dashboard-no-data-subtitle">
              Make sure your leads are properly loaded from the database
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nova-crm" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Left Sidebar */}
      <LeftSidebar 
        activeNavItem="counsellor"
        activeSubmenuItem=""
        stages={[]}
        getStageCount={() => 0}
        stagesTitle="Performance"
        stagesIcon={BarChart3}
      />

      {/* Main Content */}
      <div className="nova-main">
        <div className="dashboard-overview">
          {/* Header */}
          <div className="dashboard-header">
            <h2 className="dashboard-title">Counsellor Performance</h2>
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

          {/* Conversion Insights */}
          <div className="counsellor-insights-section">
            <h3 className="counsellor-insights-title">Conversion Insights</h3>
            
            <div className="counsellor-cards-grid">
              {counsellorData.length > 0 ? (
                counsellorData.map((counsellor, index) => (
                  <div key={index} className="counsellor-card">
                    <div className="counsellor-card-header">
                      <h4 className="counsellor-name">{counsellor.name}</h4>
                    </div>
                    
                    <div className="counsellor-metrics">
                      <div className="counsellor-metric">
                        <div className="counsellor-metric-icon">
                          <img 
                            src={meetingsDoneIcon} 
                            alt="Meetings Done" 
                            style={{ width: '16px', height: '16px' }}
                          />
                        </div>
                        <span className="counsellor-metric-label">Meetings Done</span>
                        <span className="counsellor-metric-value">{counsellor.meetingsDone}</span>
                      </div>
                      
                      <div className="counsellor-metric">
                        <div className="counsellor-metric-icon">
                          <img 
                            src={visitsDoneIcon} 
                            alt="Visits Done" 
                            style={{ width: '16px', height: '16px' }}
                          />
                        </div>
                        <span className="counsellor-metric-label">Visits Done</span>
                        <span className="counsellor-metric-value">{counsellor.visitsDone}</span>
                      </div>
                      
                      <div className="counsellor-metric">
                        <div className="counsellor-metric-icon">
                          <img 
                            src={registeredIcon} 
                            alt="Registered" 
                            style={{ width: '16px', height: '16px' }}
                          />
                        </div>
                        <span className="counsellor-metric-label">Registered</span>
                        <span className="counsellor-metric-value">{counsellor.registered}</span>
                      </div>
                      
                      <div className="counsellor-metric">
                        <div className="counsellor-metric-icon">
                          <img 
                            src={enrolledIcon} 
                            alt="Enrolled" 
                            style={{ width: '16px', height: '16px' }}
                          />
                        </div>
                        <span className="counsellor-metric-label">Enrolled</span>
                        <span className="counsellor-metric-value">{counsellor.enrolled}</span>
                      </div>
                    </div>
                    
                    <div className="counsellor-conversion">
                      <span className="counsellor-conversion-label">Conversion %</span>
                      <span className="counsellor-conversion-value">{counsellor.conversionRate}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="counsellor-no-data">
                  No counsellor data available for the selected period
                </div>
              )}
            </div>
          </div>

          {/* Charts Section */}
          <div className="counsellor-charts-section">
            {/* Success Rate Chart */}
            <div className="counsellor-chart-container">
              <h3 className="counsellor-chart-title">Success Rate by Counsellor</h3>

              {/*Dropdown for stages*/}
              <div className="counsellor-chart-controls">
                <select 
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="counsellor-metric-dropdown"
                >
                  <option value="meetingsDone">Meetings Done</option>
                  <option value="visitsDone">Visits Done</option>
                  <option value="registered">Registered</option>
                  <option value="enrolled">Enrolled</option>
                </select>
              </div>
              
              {barChartData.length > 0 ? (
                <>
                  <div className="counsellor-bar-chart">
                    <ResponsiveContainer width="60%" height={300}>
                      <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis 
                          dataKey="name" 
                          axisLine={false}
                          tickLine={false}
                          style={{ fontSize: '12px', fontWeight: '500' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          style={{ fontSize: '12px' }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#3B82F6" 
                          radius={[4, 4, 0, 0]}
                          label={{ position: 'top', fontSize: 12, fontWeight: 'bold' }}
                        />
                        <Tooltip content={<BarTooltip />} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="counsellor-chart-footer">
                    Currently viewing: Enrolled this month.
                  </div>
                </>
              ) : (
                <div className="counsellor-chart-empty">
                  No data available for chart
                </div>
              )}
            </div>

            {/* Top Performer */}
            <div className="counsellor-top-performer">
              <h3 className="counsellor-top-performer-title">Top Performer</h3>
              
              {topPerformer ? (
                <div className="counsellor-top-performer-content">
                  <div className="counsellor-trophy-icon">
                    <img 
                        src={topPerformerIcon}
                        alt="Trophy" 
                        style={{ width: '108px', height: '108px' }}
                        />
                  </div>
                  
                  <div className="counsellor-top-performer-info">
                    <div className="counsellor-top-performer-avatar">
                      {getCounsellorInitials(topPerformer.name)}
                    </div>
                    <div className="counsellor-top-performer-name">
                      {topPerformer.name}
                    </div>
                  </div>
                  
                  <div className="counsellor-top-performer-stats">
                    <div className="counsellor-top-stat">
                      <div className="counsellor-top-stat-icon">
                        <img 
                          src={topPerformerIcon} 
                          alt="Enrolled" 
                          style={{ width: '16px', height: '16px' }}
                        />
                      </div>
                      <span className="counsellor-top-stat-label">Enrolled</span>
                      <span className="counsellor-top-stat-value">{topPerformer.enrolled}</span>
                    </div>
                    
                    <div className="counsellor-top-stat">
                      <div className="counsellor-top-stat-icon">
                        <Users size={16} color="#F59E0B" />
                      </div>
                      <span className="counsellor-top-stat-label">Conversion</span>
                      <span className="counsellor-top-stat-value">{topPerformer.conversionRate}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="counsellor-top-performer-empty">
                  No performance data available
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
      </div>

      <style jsx>{`
        .counsellor-insights-section {
          margin: 24px 0;
        }

        .counsellor-insights-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1f2937;
        }

        .counsellor-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .counsellor-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .counsellor-card-header {
          margin-bottom: 16px;
        }

        .counsellor-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .counsellor-metrics {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .counsellor-metric {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .counsellor-metric-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }

        .counsellor-metric-icon img {
          width: 16px;
          height: 16px;
          object-fit: contain;
          filter: none; /* Remove any default filters */
        }

        .counsellor-metric-label {
          flex: 1;
          font-size: 14px;
          color: #6b7280;
        }

        .counsellor-metric-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          min-width: 24px;
          text-align: right;
        }

        .counsellor-conversion {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        .counsellor-conversion-label {
          font-size: 14px;
          color: #6b7280;
        }

        .counsellor-conversion-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .counsellor-charts-section {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin: 24px 0;
        }

        .counsellor-chart-container {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }

        .counsellor-chart-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1f2937;
        }

        .counsellor-bar-chart {
          height: 300px;
          margin-bottom: 16px;
        }

        .counsellor-chart-footer {
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }

        .counsellor-chart-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #6b7280;
        }

        .counsellor-top-performer {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }

        .counsellor-top-performer-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #1f2937;
        }

        .counsellor-top-performer-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .counsellor-trophy-icon {
          margin-bottom: 16px;
        }

        .counsellor-top-performer-info {
          margin-bottom: 20px;
        }

        .counsellor-top-performer-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #374151;
          margin: 0 auto 8px;
        }

        .counsellor-top-performer-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .counsellor-top-performer-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .counsellor-top-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .counsellor-top-stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .counsellor-top-stat-icon img {
          width: 16px;
          height: 16px;
          object-fit: contain;
          filter: none;
        }

        .counsellor-top-stat-label {
          flex: 1;
          font-size: 14px;
          color: #6b7280;
        }

        .counsellor-top-stat-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .counsellor-no-data,
        .counsellor-top-performer-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 120px;
          color: #6b7280;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .counsellor-charts-section {
            grid-template-columns: 1fr;
          }
          
          .counsellor-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default CounsellorPerformance;