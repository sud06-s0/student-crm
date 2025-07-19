import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase'; // Make sure this path is correct
import LeadsTable from './components/LeadsTable';
import WarmLeads from './components/WarmLeads';
import HotLeads from './components/HotLeads';
import ColdLeads from './components/ColdLeads';
import EnrolledLeads from './components/EnrolledLeads';
import Dashboard from './components/Dashboard'; 
import CounsellorPerformance from './components/CounsellorPerformance';

function App() {
  const [leadsData, setLeadsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Convert database record to UI format
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

  // Fetch all leads from Supabase
  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('Leads')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        throw error;
      }

      const convertedData = data.map(convertDatabaseToUI);
      setLeadsData(convertedData);
      
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch leads on app mount
  useEffect(() => {
    fetchLeads();
  }, []);

  // Show loading screen while data is being fetched
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<Dashboard leadsData={leadsData} />} />
        <Route path="/" element={<LeadsTable leadsData={leadsData} />} />
        <Route path="/all-leads" element={<LeadsTable leadsData={leadsData} />} />
        <Route path="/warm" element={<WarmLeads leadsData={leadsData} />} />
        <Route path="/hot" element={<HotLeads leadsData={leadsData} />} />
        <Route path="/cold" element={<ColdLeads leadsData={leadsData} />} />
        <Route path="/enrolled" element={<EnrolledLeads leadsData={leadsData} />} />
        <Route path="/counsellor-performance" element={<CounsellorPerformance leadsData={leadsData} />}/>
      </Routes>
    </Router>
  );
}

export default App;