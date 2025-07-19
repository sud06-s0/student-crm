import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logStageChange } from '../utils/historyLogger';
import AddLeadForm from './AddLeadForm';
import LeftSidebar from './LeftSidebar';
import LeadSidebar from './LeadSidebar'; // Import the new sidebar component
import { FilterButton, applyFilters } from './FilterDropdown';
import { 
  Search,
  Filter,
  ChevronDown,
  Clipboard,
  History,
  FileText,
  Phone,
  Edit,
  Edit2,
  AlertCircle,
  Loader2,
  Star
} from 'lucide-react';

const HotLeads = () => {
  const [selectedLead, setSelectedLead] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Search functionality states
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLeads, setFilteredLeads] = useState([]);

  // Stage dropdown states
  const [stageDropdownOpen, setStageDropdownOpen] = useState(null);

  // Right-click edit functionality states
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, lead: null });
  const [editLead, setEditLead] = useState(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sidebar editing states - UPDATED
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [sidebarFormData, setSidebarFormData] = useState({
    stage: '',
    offer: '',
    email: '',
    phone: '', // Fixed: Added phone field
    occupation: '',
    location: '',
    currentSchool: '',
    meetingDate: '',
    meetingTime: '',
    meetingLink: '',
    visitDate: '',
    visitTime: '',
    visitLocation: '',
    registrationFees: '',
    enrolled: ''
  });

  // Real data from Supabase
  const [leadsData, setLeadsData] = useState([]);
  const [lastActivityData, setLastActivityData] = useState({});

  //Filter states
  const [showFilter, setShowFilter] = useState(false);
  const [counsellorFilters, setCounsellorFilters] = useState([]);
  const [stageFilters, setStageFilters] = useState([]);
  const [statusFilters, setStatusFilters] = useState([]);

  // Updated Stage options with new stages and colors
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

  // Hot stages only for left sidebar display
  const hotStages = stages.filter(stage => 
    ['Visit Booked', 'Visit Done', 'Registered'].includes(stage.value)
  );

  const offers = [
    '30000 Scholarship',
    '10000 Discount',
    'Welcome Kit',
    'Accessible Kit'
  ];

  // Calculate stage counts
  const getStageCount = (stageName) => {
    return leadsData.filter(lead => lead.stage === stageName).length;
  };

  // Updated scoring system to match new stages
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

  // Updated category mapping to match new stages
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

  // Get stage color
  const getStageColor = (stage) => {
    const stageObj = stages.find(s => s.value === stage);
    return stageObj ? stageObj.color : '#B3D7FF';
  };

  // Get counsellor initials from first two words
  const getCounsellorInitials = (fullName) => {
    if (!fullName) return 'NA';
    const words = fullName.trim().split(' ');
    const firstTwoWords = words.slice(0, 2);
    return firstTwoWords.map(word => word.charAt(0).toUpperCase()).join('');
  };

  // Fetch last activity data for all leads
  const fetchLastActivityData = async () => {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('record_id, action_timestamp')
        .order('action_timestamp', { ascending: false });

      if (error) throw error;

      // Group by record_id and get the latest timestamp
      const activityMap = {};
      data.forEach(log => {
        const leadId = log.record_id;
        if (!activityMap[leadId] || new Date(log.action_timestamp) > new Date(activityMap[leadId])) {
          activityMap[leadId] = log.action_timestamp;
        }
      });

      setLastActivityData(activityMap);
    } catch (error) {
      console.error('Error fetching last activity data:', error);
    }
  };

  // Calculate days since last activity
  const getDaysSinceLastActivity = (leadId) => {
    const lastActivity = lastActivityData[leadId];
    if (!lastActivity) {
      // No activity logged yet, so no alert
      return 0;
    }
    
    const lastActivityDate = new Date(lastActivity);
    const today = new Date();
    const diffTime = today - lastActivityDate;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    return diffMinutes;
  };

  // Check if lead needs alert (3+ days without activity)
  const shouldShowAlert = (leadId) => {
    const days = getDaysSinceLastActivity(leadId);
    return days >= 2;
  };

  // Convert database record to UI format - UPDATED
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
  const fetchHotLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('Leads')
        .select('*')
        .eq('category', 'Hot')
        .order('id', { ascending: true });

      if (error) {
        throw error;
      }

      const convertedData = data.map(convertDatabaseToUI);
      setLeadsData(convertedData);
      
      // Also fetch last activity data
      await fetchLastActivityData();
      
    } catch (error) {
      console.error('Error fetching leads:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch leads on component mount
  useEffect(() => {
    fetchHotLeads();
  }, []);

  // Helper functions for styling
  const getStageClass = (stage) => {
    const stageMap = {
      "New Lead": "stage-new-lead",
      "Connected": "stage-connected",
      "Meeting Booked": "stage-meeting-booked",
      "Meeting Done": "stage-meeting-done",
      "Proposal Sent": "stage-proposal-sent",
      "Visit Booked": "stage-visit-booked",
      "Visit Done": "stage-visit-done",
      "Registered": "stage-registered",
      "Admission": "stage-admission",
      "No Response": "stage-no-response"
    };
    return stageMap[stage] || "stage-new-lead";
  };

  const getCategoryClass = (category) => {
    const categoryMap = {
      "New": "status-new",
      "Warm": "status-warm",
      "Hot": "status-hot",
      "Enrolled": "status-enrolled",
      "Cold": "status-cold"
    };
    return categoryMap[category] || "status-new";
  };

  const openSidebar = (lead) => {
    console.log('Opening sidebar for lead:', lead);
    setSelectedLead(lead);
    setSidebarFormData({
      stage: lead.stage,
      offer: lead.offer || 'Welcome Kit',
      email: lead.email || '',
      phone: lead.phone || '', // Fixed: Added phone field
      occupation: lead.occupation || '',
      location: lead.location || '',
      currentSchool: lead.currentSchool || '',
      meetingDate: lead.meetingDate || '',
      meetingTime: lead.meetingTime || '',
      meetingLink: lead.meetingLink || '',
      visitDate: lead.visitDate || '',
      visitTime: lead.visitTime || '',
      visitLocation: lead.visitLocation || '',
      registrationFees: lead.registrationFees || '',
      enrolled: lead.enrolled || ''
    });
    setShowSidebar(true);
    setIsEditingMode(false);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
    setSelectedLead(null);
    setIsEditingMode(false);
  };

  // Handle edit mode toggle
  const handleEditModeToggle = () => {
    console.log('handleEditModeToggle called - current isEditingMode:', isEditingMode);
    setIsEditingMode(!isEditingMode);
    console.log('handleEditModeToggle - new isEditingMode:', !isEditingMode);
  };

  // Handle form field changes
  const handleSidebarFieldChange = (field, value) => {
    console.log('Field change:', field, value);
    setSidebarFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // UPDATED: Handle stage change from sidebar with history logging
  const handleSidebarStageChange = async (leadId, newStage) => {
    try {
      const lead = leadsData.find(l => l.id === leadId);
      const oldStage = lead.stage;
      const updatedScore = getScoreFromStage(newStage);
      const updatedCategory = getCategoryFromStage(newStage);
      
      // Log the stage change FIRST (before database update)
      if (oldStage !== newStage) {
        await logStageChange(leadId, oldStage, newStage, 'sidebar');
      }

      // Update in database
      // NEW: Prepare update data
      let updateData = { 
        stage: newStage, 
        score: updatedScore, 
        category: updatedCategory,
        updated_at: new Date().toISOString()
      };

      // NEW: Store previous stage if moving TO 'No Response' FROM any other stage
      if (newStage === 'No Response' && oldStage !== 'No Response') {
        updateData.previous_stage = oldStage;
      }

      // NEW: Clear previous stage if moving FROM 'No Response' TO any other stage
      if (oldStage === 'No Response' && newStage !== 'No Response') {
        updateData.previous_stage = null;
      }

      // Update in database
      const { error } = await supabase
        .from('Leads')
        .update(updateData)
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      // Refresh activity data after database update
      await fetchLastActivityData();

      // If the lead is no longer hot, remove from local state and close sidebar
      if (updatedCategory !== 'Hot') {
        const updatedLeads = leadsData.filter(lead => lead.id !== leadId);
        setLeadsData(updatedLeads);
        closeSidebar();
      } else {
        // Update local state if still hot
        const updatedLeads = leadsData.map(lead => 
          lead.id === leadId 
            ? { ...lead, stage: newStage, score: updatedScore, category: updatedCategory }
            : lead
        );
        
        setLeadsData(updatedLeads);

        // Update selected lead if it's the one being changed
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead({
            ...selectedLead,
            stage: newStage,
            score: updatedScore,
            category: updatedCategory
          });
        }
      }

      // Show success message
      alert('Stage updated successfully!');
      
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Error updating stage: ' + error.message);
    }
  };

  // COMPLETE: Handle update all fields function
  const handleUpdateAllFields = async () => {
    try {
      console.log('handleUpdateAllFields called with sidebarFormData:', sidebarFormData);
      
      // Prepare the update data
      const updateData = {
        stage: sidebarFormData.stage,
        score: getScoreFromStage(sidebarFormData.stage),
        category: getCategoryFromStage(sidebarFormData.stage),
        offer: sidebarFormData.offer,
        email: sidebarFormData.email,
        phone: sidebarFormData.phone, // Fixed: Added phone field
        occupation: sidebarFormData.occupation,
        location: sidebarFormData.location,
        current_school: sidebarFormData.currentSchool,
        meet_link: sidebarFormData.meetingLink,
        visit_location: sidebarFormData.visitLocation,
        reg_fees: sidebarFormData.registrationFees,
        enrolled: sidebarFormData.enrolled,
        updated_at: new Date().toISOString()
      };

      // Handle datetime fields
      if (sidebarFormData.meetingDate && sidebarFormData.meetingTime) {
        updateData.meet_datetime = new Date(`${sidebarFormData.meetingDate}T${sidebarFormData.meetingTime}:00`).toISOString();
      }

      if (sidebarFormData.visitDate && sidebarFormData.visitTime) {
        updateData.visit_datetime = new Date(`${sidebarFormData.visitDate}T${sidebarFormData.visitTime}:00`).toISOString();
      }

      // Check if stage changed for logging
      const oldStage = selectedLead.stage;
      const newStage = sidebarFormData.stage;
      
      // Log stage change if it occurred
      if (oldStage !== newStage) {
        await logStageChange(selectedLead.id, oldStage, newStage, 'sidebar edit all');
      }

      // Check if lead will remain hot after update
      const newCategory = getCategoryFromStage(sidebarFormData.stage);

      // Update in database
      const { error } = await supabase
        .from('Leads')
        .update(updateData)
        .eq('id', selectedLead.id);

      if (error) {
        throw error;
      }

      // Refresh activity data after any updates
      await fetchLastActivityData();

      // If lead is no longer hot, close sidebar and refresh
      if (newCategory !== 'Hot') {
        closeSidebar();
        await fetchHotLeads();
      } else {
        // Refresh the leads data
        await fetchHotLeads(); // This will also refresh activity data

        // Update selected lead
        const updatedLead = {
          ...selectedLead,
          ...sidebarFormData,
          score: getScoreFromStage(sidebarFormData.stage),
          category: getCategoryFromStage(sidebarFormData.stage)
        };
        setSelectedLead(updatedLead);
      }

      // Exit edit mode
      setIsEditingMode(false);

      alert('Lead updated successfully!');

    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Error updating lead: ' + error.message);
    }
  };

  // Handle stage dropdown toggle
  const handleStageDropdownToggle = (e, leadId) => {
    e.stopPropagation(); // Prevent row click
    setStageDropdownOpen(stageDropdownOpen === leadId ? null : leadId);
  };

  // UPDATED: Handle stage change from dropdown with history logging
  const handleStageChangeFromDropdown = async (e, leadId, newStage) => {
    e.stopPropagation(); // Prevent row click
    
    try {
      const lead = leadsData.find(l => l.id === leadId);
      const oldStage = lead.stage;
      const updatedScore = getScoreFromStage(newStage);
      const updatedCategory = getCategoryFromStage(newStage);
      
      // Log the stage change FIRST (before database update)
      if (oldStage !== newStage) {
        await logStageChange(leadId, oldStage, newStage, 'table dropdown');
      }

      // Update in database
      // NEW: Prepare update data
      let updateData = { 
        stage: newStage, 
        score: updatedScore, 
        category: updatedCategory,
        updated_at: new Date().toISOString()
      };

      // NEW: Store previous stage if moving TO 'No Response' FROM any other stage
      if (newStage === 'No Response' && oldStage !== 'No Response') {
        updateData.previous_stage = oldStage;
      }

      // NEW: Clear previous stage if moving FROM 'No Response' TO any other stage
      if (oldStage === 'No Response' && newStage !== 'No Response') {
        updateData.previous_stage = null;
      }

      // Update in database
      const { error } = await supabase
        .from('Leads')
        .update(updateData)
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      // Refresh activity data after database update
      await fetchLastActivityData();

      // If the lead is no longer hot, remove from local state
      if (updatedCategory !== 'Hot') {
        const updatedLeads = leadsData.filter(lead => lead.id !== leadId);
        setLeadsData(updatedLeads);
      } else {
        // Update local state if still hot
        const updatedLeads = leadsData.map(lead => 
          lead.id === leadId 
            ? { ...lead, stage: newStage, score: updatedScore, category: updatedCategory }
            : lead
        );
        
        setLeadsData(updatedLeads);
      }
      
      // Close dropdown
      setStageDropdownOpen(null);
      
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Error updating stage: ' + error.message);
    }
  };

  // UPDATED: Handle form submission with history logging
  const handleAddLead = async (action = 'add') => {
    await fetchHotLeads(); // This will also fetch activity data
    await fetchLastActivityData();
    
    // Log the action if it's a new lead
    if (action === 'add') {
      // We don't have the lead ID here, but we can log it after fetching
      // The AddLeadForm component should handle this logging
    }
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
    setEditLead(null);
  };

  // Right-click context menu functionality
  const handleRightClick = (e, lead) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      lead: lead
    });
  };

  const handleEditLead = () => {
    setEditLead(contextMenu.lead);
    setShowAddForm(true);
    setContextMenu({ visible: false, x: 0, y: 0, lead: null });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, lead: null });
  };

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        handleCloseContextMenu();
      }
      // Close stage dropdown when clicking outside
      if (stageDropdownOpen) {
        setStageDropdownOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.visible, stageDropdownOpen]);

  // Search functionality
  const handleSearchClick = () => {
    setShowSearch(true);
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredLeads([]);
    } else {
      const filtered = leadsData.filter(lead => 
        lead.parentsName.toLowerCase().includes(term.toLowerCase()) ||
        lead.kidsName.toLowerCase().includes(term.toLowerCase()) ||
        lead.phone.toLowerCase().includes(term.toLowerCase()) ||
        lead.stage.toLowerCase().includes(term.toLowerCase()) ||
        lead.counsellor.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredLeads(filtered);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredLeads([]);
    setShowSearch(false);
  };

  // Determine which data to display
  const getDisplayLeads = () => {
    let filtered = leadsData;
    
    // Apply search first
    if (searchTerm.trim() !== '') {
      filtered = leadsData.filter(lead => 
        lead.parentsName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.kidsName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.stage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.counsellor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Then apply filters
    return applyFilters(filtered, counsellorFilters, stageFilters, statusFilters);
  };

  const displayLeads = getDisplayLeads();

  return (
    <div className="nova-crm" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Left Sidebar - Now using the reusable component */}
      <LeftSidebar 
        activeNavItem="leads"
        activeSubmenuItem="hot"
        stages={hotStages}
        getStageCount={getStageCount}
        stagesTitle="Hot Stages"
        stagesIcon={Star}
      />

      {/* Main Content */}
      <div className="nova-main">
        {/* Header */}
        <div className="nova-header">
          <div className="header-left">
            <h1>Hot Leads</h1>
            <span className="total-count">Total Hot Leads {leadsData.length}</span>
          </div>
          <div className="header-right">
            <div className="search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search hot leads..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
            <FilterButton
              showFilter={showFilter}
              setShowFilter={setShowFilter}
              counsellorFilters={counsellorFilters}
              stageFilters={stageFilters}
              statusFilters={statusFilters}  
              setCounsellorFilters={setCounsellorFilters}
              setStageFilters={setStageFilters}
              setStatusFilters={setStatusFilters}  
            />
            <button className="add-lead-btn" onClick={handleShowAddForm}>
              + Add Lead
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <AlertCircle size={16} /> Error: {error}
          </div>
        )}

        {/* Loading Display */}
        {loading && (
          <div className="loading-message">
            <Loader2 size={16} className="animate-spin" /> Loading hot leads...
          </div>
        )}

        {/* Leads Table */}
        <div className="nova-table-container">
          <table className="nova-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" className="select-all" />
                </th>
                <th>ID</th>
                <th>Parent Name</th>
                <th>Phone</th>
                <th>Class</th>
                <th>Stage</th>
                <th>Status</th>
                <th>Counsellor</th>
                <th>Alert</th>
              </tr>
            </thead>
            <tbody>
              {!loading && displayLeads.length > 0 ? (
                displayLeads.map(lead => (
                  <tr 
                    key={lead.id} 
                    onClick={() => openSidebar(lead)} 
                    onContextMenu={(e) => handleRightClick(e, lead)}
                    className="table-row"
                  >
                    <td>
                      <input type="checkbox" onClick={(e) => e.stopPropagation()} />
                    </td>
                    <td>{lead.id}</td>
                    <td>
                      <div className="parent-info">
                        <div className="parent-name">{lead.parentsName}</div>
                        <div className="kid-name">{lead.kidsName}</div>
                      </div>
                    </td>
                    <td>{lead.phone?.replace('+91', '')}</td>
                    <td>{lead.grade}</td>
                    <td>
                      <div className="stage-dropdown-container" style={{ position: 'relative', width: '100%' }}>
                        <div 
                          className="stage-badge stage-dropdown-trigger" 
                          style={{ 
                            backgroundColor: getStageColor(lead.stage), 
                            color: '#333',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: 'max-content',
                            minWidth: '140px',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(0,0,0,0.1)',
                            fontWeight: '600',
                            fontSize: '12px'
                          }}
                          onClick={(e) => handleStageDropdownToggle(e, lead.id)}
                        >
                          <span style={{ fontWeight: '600' }}>{lead.stage}</span>
                          <ChevronDown 
                            size={14} 
                            style={{ 
                              flexShrink: 0,
                              transition: 'transform 0.2s ease',
                              transform: stageDropdownOpen === lead.id ? 'rotate(180deg)' : 'rotate(0deg)',
                              marginLeft: '8px'
                            }} 
                          />
                        </div>
                        
                        {stageDropdownOpen === lead.id && (
                          <div className="stage-dropdown-menu" style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                            zIndex: 1000,
                            maxHeight: '180px',
                            overflowY: 'auto',
                            marginTop: '2px',
                            minWidth: '140px',
                            width: 'max-content'
                          }}>
                            {stages.map((stage, index) => (
                              <div
                                key={stage.value}
                                className="stage-dropdown-item"
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  backgroundColor: 'white',
                                  color: '#333',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  borderBottom: index < stages.length - 1 ? '1px solid #f3f4f6' : 'none',
                                  transition: 'all 0.15s ease',
                                  whiteSpace: 'nowrap'
                                }}
                                onClick={(e) => handleStageChangeFromDropdown(e, lead.id, stage.value)}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#f8f9fa';
                                  e.target.style.transform = 'translateX(2px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'white';
                                  e.target.style.transform = 'translateX(0px)';
                                }}
                              >
                                <span 
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: stage.color,
                                    border: '1px solid rgba(0,0,0,0.15)',
                                    flexShrink: 0
                                  }}
                                ></span>
                                <span style={{ flex: 1 }}>{stage.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td>
                      <span className="status-badge-text">
                        {lead.category}
                      </span>
                    </td>
                    <td className="counsellor-middle">
                      <div className="counsellor-avatar">
                        {getCounsellorInitials(lead.counsellor)}
                      </div>
                    </td>
                    <td>
                      {shouldShowAlert(lead.id) && (
                        <div 
                          className="alert-badge"                     
                        >
                          {getDaysSinceLastActivity(lead.id)}M
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : !loading ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    {searchTerm ? 'No results found for your search.' : 'No hot leads available. Click + Add Lead to create your first lead!'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Sidebar Component - FULLY FIXED */}
      <LeadSidebar
        showSidebar={showSidebar}
        selectedLead={selectedLead}
        isEditingMode={isEditingMode}
        sidebarFormData={sidebarFormData}
        stages={stages}
        onClose={closeSidebar}
        onEditModeToggle={handleEditModeToggle}
        onFieldChange={handleSidebarFieldChange}
        onUpdateAllFields={handleUpdateAllFields}
        onStageChange={handleSidebarStageChange}
        onRefreshActivityData={fetchLastActivityData} // Fixed: Added this prop
        getStageColor={getStageColor}
        getCounsellorInitials={getCounsellorInitials}
        getScoreFromStage={getScoreFromStage}
        getCategoryFromStage={getCategoryFromStage}
      />

      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className="context-menu" 
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="context-menu-item" onClick={handleEditLead}>
            <Edit2 size={14} /> Edit
          </div>
        </div>
      )}

      {/* Add Lead Form */}
      {showAddForm && (
        <AddLeadForm
          isOpen={showAddForm}
          onClose={handleCloseAddForm}
          onSubmit={handleAddLead}
          existingLeads={leadsData}
          editLead={editLead}
        />
      )}
    </div>
  );
};

export default HotLeads;