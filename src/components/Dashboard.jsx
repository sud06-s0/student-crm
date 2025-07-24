import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Adjust path as needed
import OverviewDashboard from './OverviewDashboard';
import LeftSidebar from './LeftSidebar'; // If you want to include sidebar
import { Play } from 'lucide-react'; // If you're using lucide icons

const Dashboard = ({ onLogout, user }) => {
  const [leadsData, setLeadsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Convert database record to UI format (copied from LeadsTable.jsx)
  const convertDatabaseToUI = (dbRecord) => {
    // Parse datetime fields
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

  // Fetch leads from Supabase
  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('Leads')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        throw error;
      }

      console.log('Raw data from Supabase:', data); // Debug log
      const convertedData = data.map(convertDatabaseToUI);
      console.log('Converted data:', convertedData); // Debug log
      setLeadsData(convertedData);
      
    } catch (error) {
      console.error('Error fetching leads:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch leads on component mount
  useEffect(() => {
    fetchLeads();
  }, []);

  // Stage definitions (copied from LeadsTable.jsx)
  const stages = [
    { value: 'New Lead', label: 'New Lead', color: '#B3D7FF' },
    { value: 'Connected', label: 'Connected', color: '#E9FF9A' },
    { value: 'Meeting Booked', label: 'Meeting Booked', color: '#FFEC9F' },
    { value: 'Meeting Done', label: 'Meeting Done', color: '#FF9697' },
    { value: 'Proposal Sent', label: 'Proposal Sent', color: '#FFC796' },
    { value: 'Visit Booked', label: 'Visit Booked', color: '#D1A4FF' },
    { value: 'Visit Done', label: 'Visit Done', color: '#B1FFFF' },
    { value: 'Registered', label: 'Registered', color: '#FF99EB' },
    { value: 'Admission', label: 'Admission', color: '#98FFB4' },
    { value: 'No Response', label: 'No Response', color: '#B5BAB1' }
  ];

  // Calculate stage counts
  const getStageCount = (stageName) => {
    return leadsData.filter(lead => lead.stage === stageName).length;
  };

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

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#ef4444'
      }}>
        Error loading dashboard: {error}
      </div>
    );
  }

  return (
    <div className="nova-crm" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Left Sidebar */}
      <LeftSidebar 
        activeNavItem="dashboard"
        activeSubmenuItem="overview"
        stages={stages}
        getStageCount={getStageCount}
        stagesTitle="Stages"
        stagesIcon={Play}
        onLogout={onLogout}
        user={user}
      />

      {/* Main Dashboard Content */}
      <div className="nova-main">
        <OverviewDashboard />
      </div>
    </div>
  );
};

export default Dashboard;