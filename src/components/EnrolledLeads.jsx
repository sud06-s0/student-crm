import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logStageChange } from '../utils/historyLogger';
import AddLeadForm from './AddLeadForm';
import LeftSidebar from './LeftSidebar';
import LeadSidebar from './LeadSidebar';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { FilterButton, applyFilters } from './FilterDropdown';
import { useLeadState } from './LeadStateProvider'; // ← ADD THIS IMPORT
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
  Play,
  Mail,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Link,
  DollarSign,
  CheckCircle,
  Trash2
} from 'lucide-react';

const EnrolledLeads = ({ onLogout, user }) => {
  // ← REPLACE THESE LINES WITH CONTEXT
  // OLD: const [selectedLead, setSelectedLead] = useState(null);
  // OLD: const [leadsData, setLeadsData] = useState([]);
  
  // NEW: Use the context hook instead of local state
  const { 
    selectedLead, 
    setSelectedLead, 
    leadsData, 
    setLeadsData,
    updateCompleteLeadData,
    getScoreFromStage,
    getCategoryFromStage
  } = useLeadState();

  const [showSidebar, setShowSidebar] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Search functionality states
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLeads, setFilteredLeads] = useState([]);

  // Stage dropdown states
  const [stageDropdownOpen, setStageDropdownOpen] = useState(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // DELETE FUNCTIONALITY - NEW STATES
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sidebar editing states - UPDATED
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [sidebarFormData, setSidebarFormData] = useState({
    parentsName: '',
    kidsName: '',
    grade: '',
    source: '',
    stage: '',
    offer: '',
    email: '',
    phone: '',
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

  const offers = [
    '30000 Scholarship',
    '10000 Discount',
    'Welcome Kit',
    'Accessible Kit'
  ];

  // DELETE FUNCTIONALITY - NEW FUNCTIONS
  const handleIndividualCheckboxChange = (leadId, checked) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
      setSelectAll(false);
    }
  };

  const handleSelectAllChange = (checked) => {
    setSelectAll(checked);
    if (checked) {
      const allLeadIds = displayLeads.map(lead => lead.id);
      setSelectedLeads(allLeadIds);
    } else {
      setSelectedLeads([]);
    }
  };

  const handleDeleteClick = () => {
    if (selectedLeads.length > 0) {
      setShowDeleteDialog(true);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('Leads')
        .delete()
        .in('id', selectedLeads);

      if (error) {
        throw error;
      }

      // Refresh the leads data
      await fetchLeads();
      
      // Clear selections
      setSelectedLeads([]);
      setSelectAll(false);
      setShowDeleteDialog(false);
      
    } catch (error) {
      console.error('Error deleting leads:', error);
      alert('Error deleting leads: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  // Clear selections when leads data changes (after filters/search)
  useEffect(() => {
    setSelectedLeads([]);
    setSelectAll(false);
  }, [searchTerm, counsellorFilters, stageFilters, statusFilters]);

  // Calculate stage counts
  const getStageCount = (stageName) => {
    return leadsData.filter(lead => lead.stage === stageName).length;
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

  
  // Fetch last activity data for all leads - USING DATABASE VIEW (FASTEST)
    const fetchLastActivityData = async () => {
      try {
        const { data, error } = await supabase
          .from('last_activity_by_lead')  // ← Use the database view
          .select('*');

        if (error) throw error;

        // Simple processing - data is already grouped by database
        const activityMap = {};
        data.forEach(item => {
          activityMap[item.record_id] = item.last_activity;
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
      return 0;
    }
    
    const lastActivityDate = new Date(lastActivity);
    const today = new Date();
    const diffTime = today - lastActivityDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Check if lead needs alert (3+ days without activity)
  const shouldShowAlert = (leadId) => {
    const days = getDaysSinceLastActivity(leadId);
    return days >= 3;
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

  // Fetch leads from Supabase - USING DATABASE VIEW (FASTEST)
    const fetchLeads = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Make both API calls in parallel using the fast view
        const [leadsResponse, activityResponse] = await Promise.all([
          supabase.from('Leads').select('*').order('id', { ascending: false }),
          supabase.from('last_activity_by_lead').select('*')  // ← Use the view
        ]);

        if (leadsResponse.error) throw leadsResponse.error;
        if (activityResponse.error) throw activityResponse.error;

        // Process leads data
        const convertedData = leadsResponse.data.map(convertDatabaseToUI);
        setLeadsData(convertedData);
        
        // Process activity data (super fast now)
        const activityMap = {};
        activityResponse.data.forEach(item => {
          activityMap[item.record_id] = item.last_activity;
        });
        setLastActivityData(activityMap);
        
      } catch (error) {
        console.error('Error fetching leads:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

  // Fetch leads on component mount
      useEffect(() => {
      console.time('Page load time');
      fetchLeads().then(() => {
        console.timeEnd('Page load time');
      });
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
      parentsName: lead.parentsName || '',
      kidsName: lead.kidsName || '',
      grade: lead.grade || '',
      source: lead.source || 'Instagram',
      stage: lead.stage,
      offer: lead.offer || 'Welcome Kit',
      email: lead.email || '',
      phone: lead.phone || '',
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
      let updateData = { 
        stage: newStage, 
        score: updatedScore, 
        category: updatedCategory,
        updated_at: new Date().toISOString()
      };

      // Store previous stage if moving TO 'No Response' FROM any other stage
      if (newStage === 'No Response' && oldStage !== 'No Response') {
        updateData.previous_stage = oldStage;
      }

      // Clear previous stage if moving FROM 'No Response' TO any other stage
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

      // Update local state
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

      // Show success message
      alert('Stage updated successfully!');
      
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Error updating stage: ' + error.message);
    }
  };

  // ← UPDATED: Handle update all fields function with context
  const handleUpdateAllFields = async () => {
    try {
      console.log('handleUpdateAllFields called with sidebarFormData:', sidebarFormData);
      
      // Format phone number properly
      let formattedPhone = sidebarFormData.phone;
      if (formattedPhone && !formattedPhone.startsWith('+91')) {
        // Remove any existing +91 and re-add it
        formattedPhone = formattedPhone.replace(/^\+91/, '');
        formattedPhone = `+91${formattedPhone}`;
      }
      
      // Prepare the update data
      const updateData = {
        parents_name: sidebarFormData.parentsName,
        kids_name: sidebarFormData.kidsName,
        grade: sidebarFormData.grade,
        source: sidebarFormData.source,
        phone: formattedPhone,
        stage: sidebarFormData.stage,
        score: getScoreFromStage(sidebarFormData.stage),
        category: getCategoryFromStage(sidebarFormData.stage),
        offer: sidebarFormData.offer,
        email: sidebarFormData.email,
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

      console.log('Database update data:', updateData);

      // Update in database
      const { error } = await supabase
        .from('Leads')
        .update(updateData)
        .eq('id', selectedLead.id);

      if (error) {
        throw error;
      }

      console.log('Database update successful');

      // Refresh activity data after any updates
      await fetchLastActivityData();

      // Refresh the leads data
      await fetchLeads();

      // Exit edit mode
      setIsEditingMode(false);

      // ← USE CONTEXT to update the lead state instead of manual setState
      updateCompleteLeadData(selectedLead.id, sidebarFormData);

      console.log('Sidebar refresh completed successfully');

    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Error updating lead: ' + error.message);
    }
  };

  // Handle stage dropdown toggle
  const handleStageDropdownToggle = (e, leadId) => {
    e.stopPropagation();
    setStageDropdownOpen(stageDropdownOpen === leadId ? null : leadId);
  };

  // UPDATED: Handle stage change from dropdown with history logging
  const handleStageChangeFromDropdown = async (e, leadId, newStage) => {
    e.stopPropagation();
    
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
      let updateData = { 
        stage: newStage, 
        score: updatedScore, 
        category: updatedCategory,
        updated_at: new Date().toISOString()
      };

      // Store previous stage if moving TO 'No Response' FROM any other stage
      if (newStage === 'No Response' && oldStage !== 'No Response') {
        updateData.previous_stage = oldStage;
      }

      // Clear previous stage if moving FROM 'No Response' TO any other stage
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

      // Update local state
      const updatedLeads = leadsData.map(lead => 
        lead.id === leadId 
          ? { ...lead, stage: newStage, score: updatedScore, category: updatedCategory }
          : lead
      );
      
      setLeadsData(updatedLeads);
      
      // Close dropdown
      setStageDropdownOpen(null);
      
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Error updating stage: ' + error.message);
    }
  };

  
  // UPDATED: Handle form submission with history logging
   // FIXED VERSION:
const handleAddLead = async (action = 'add') => {
  await fetchLeads(); // Refresh leads data (already includes activity data)
  
  // The key={selectedLead?.id} prop on LeadSidebar will automatically
  // handle refreshing the sidebar when the lead data changes.
  // No need for manual selectedLead updates here.
};

  const handleShowAddForm = () => {
    setShowAddForm(true);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
  };

  // Close stage dropdown when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      if (stageDropdownOpen) {
        setStageDropdownOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [stageDropdownOpen]);

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
  let filtered = leadsData.filter(lead => lead.category === 'Enrolled');
    
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
      {/* Left Sidebar */}
      <LeftSidebar 
        activeNavItem="leads"
        activeSubmenuItem="enrolled"
        stages={stages}
        getStageCount={getStageCount}
        stagesTitle="Stages"
        stagesIcon={Play}
        onLogout={onLogout}
        user={user}
      />

      {/* Main Content */}
      <div className="nova-main">
        {/* Header */}
        <div className="nova-header">
          <div className="header-left">
            <h1>Enrolled Leads</h1>
            <span className="total-count">Enrolled Leads {leadsData.length}</span>
            
            {/* DELETE BUTTON - Shows when leads are selected */}
            {selectedLeads.length > 0 && (
              <button 
                className="delete-selected-btn" 
                onClick={handleDeleteClick}
                disabled={isDeleting}
                style={{
                  marginLeft: '16px',
                  padding: '8px 12px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isDeleting ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.target.style.background = '#b91c1c';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) {
                    e.target.style.background = '#dc2626';
                  }
                }}
              >
                <Trash2 size={16} />
                Delete {selectedLeads.length} Selected
              </button>
            )}
          </div>
          <div className="header-right">
            <div className="search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search leads..."
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
            <Loader2 size={16} className="animate-spin" /> Loading leads...
          </div>
        )}

        {/* Leads Table */}
        <div className="nova-table-container">
          <table className="nova-table">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    className="select-all"
                    checked={selectAll}
                    onChange={(e) => handleSelectAllChange(e.target.checked)}
                  />
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
                    className="table-row"
                  >
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => handleIndividualCheckboxChange(lead.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()} 
                      />
                    </td>
                    <td>
                      <div className="id-info">
                        <div className="lead-id">{lead.id}</div>
                        <div className="created-date">{new Date(lead.createdTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      </div>
                    </td>
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
                            left: 70,
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                            zIndex: 1000,
                            maxHeight: '380px',
                            overflowY: 'auto',
                            marginTop: '2px',
                            minWidth: '150px',
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
                        <div className="alert-badge">
                          {getDaysSinceLastActivity(lead.id)}D
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : !loading ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    {searchTerm ? 'No enrolled leads found for your search.' : 'No enrolled leads available. Enrolled leads will appear here as they progress through the stages.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* ← UPDATED: Lead Sidebar Component - removed onActionStatusUpdate prop */}
      <LeadSidebar
        key={selectedLead?.id}
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
        onRefreshActivityData={fetchLastActivityData}
        getStageColor={getStageColor}
        getCounsellorInitials={getCounsellorInitials}
        getScoreFromStage={getScoreFromStage}
        getCategoryFromStage={getCategoryFromStage}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        selectedLeads={selectedLeads}
        leadsData={leadsData}
      />

      {/* Add Lead Form */}
      {showAddForm && (
        <AddLeadForm
          isOpen={showAddForm}
          onClose={handleCloseAddForm}
          onSubmit={handleAddLead}
          existingLeads={leadsData}
        />
      )}
    </div>
  );
};

export default EnrolledLeads;