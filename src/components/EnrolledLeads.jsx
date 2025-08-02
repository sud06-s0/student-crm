import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { settingsService } from '../services/settingsService'; // ← NEW: Import for custom fields
import { logStageChange } from '../utils/historyLogger';
import AddLeadForm from './AddLeadForm';
import LeftSidebar from './LeftSidebar';
import LeadSidebar from './LeadSidebar';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import FilterDropdown, { FilterButton, applyFilters } from './FilterDropdown';
import LeadStateProvider,{ useLeadState } from './LeadStateProvider';
import SettingsDataProvider, { useSettingsData } from '../contexts/SettingsDataProvider';
import ImportLeadsModal from './ImportLeadsModal';
import MobileHeaderDropdown from './MobileHeaderDropdown';
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
  Trash2,
  Plus
} from 'lucide-react';

const EnrolledLeads = ({ onLogout, user }) => {
  // ← USE SETTINGS DATA CONTEXT
  const { 
    settingsData, 
    getFieldLabel, // ← NEW: Use for all field labels
    getStageInfo,
    getStageColor, 
    getStageScore, 
    getStageCategory,
    getStageKeyFromName, // ← NEW: Convert stage name to stage_key
    getStageNameFromKey, // ← NEW: Convert stage_key to stage name
    stageKeyToDataMapping, // ← NEW: Direct stage data mapping
    loading: settingsLoading 
  } = useSettingsData();
  
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
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [isMobile, setIsMobile] = useState(false);


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

  

  // ← UPDATED: Sidebar editing states with field_key support
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
    secondPhone: '',
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
    enrolled: '',
    notes: '' // ← Added notes field
  });

  // Real data from Supabase
  const [lastActivityData, setLastActivityData] = useState({});

  //Filter states
  const [showFilter, setShowFilter] = useState(false);
  const [counsellorFilters, setCounsellorFilters] = useState([]);
  const [stageFilters, setStageFilters] = useState([]);
  const [statusFilters, setStatusFilters] = useState([]);
  const [alertFilter, setAlertFilter] = useState(false); // ← NEW: Alert filter state

  // ← UPDATED: Get dynamic stages with stage_key support
  const stages = settingsData.stages.map(stage => ({
    value: stage.stage_key || stage.name, // ← Use stage_key if available
    label: stage.name, // ← Display name
    color: stage.color || '#B3D7FF',
    score: stage.score || 10,
    category: stage.category || 'New'
  }));

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

  // ← NEW: Convert database record to UI format with custom fields support
  const convertDatabaseToUIWithCustomFields = async (dbRecord) => {
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

    // Handle stage value - could be stage name or stage_key
    const stageValue = dbRecord.stage;
    const stageKey = getStageKeyForLead(stageValue);
    const displayName = getStageDisplayName(stageValue);

    // Base lead data
    const baseLeadData = {
      id: dbRecord.id,
      parentsName: dbRecord.parents_name,
      kidsName: dbRecord.kids_name,
      phone: dbRecord.phone,
      secondPhone: dbRecord.second_phone || '',
      location: dbRecord.location,
      grade: dbRecord.grade,
      stage: stageKey, // Store stage_key internally
      stageDisplayName: displayName, // Store display name for UI
      score: dbRecord.score,
      category: dbRecord.category,
      counsellor: dbRecord.counsellor,
      offer: dbRecord.offer,
      notes: dbRecord.notes || '',
      email: dbRecord.email || '',
      occupation: dbRecord.occupation || '',
      source: dbRecord.source || settingsData.sources?.[0]?.name || 'Instagram',
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

    // ← NEW: Fetch and attach custom fields
    try {
      const customFields = await settingsService.getCustomFieldsForLead(dbRecord.id);
      baseLeadData.customFields = customFields;
    } catch (error) {
      console.error('Error fetching custom fields for lead', dbRecord.id, error);
      baseLeadData.customFields = {};
    }

    return baseLeadData;
  };

  // ← NEW: Setup sidebar form data with custom fields support
  const setupSidebarFormDataWithCustomFields = (lead) => {
    const baseFormData = {
      parentsName: lead.parentsName || '',
      kidsName: lead.kidsName || '',
      grade: lead.grade || '',
      source: lead.source || settingsData.sources?.[0]?.name || 'Instagram',
      stage: lead.stage, // This is now stage_key
      counsellor: lead.counsellor || '',
      offer: lead.offer || 'Welcome Kit',
      email: lead.email || '',
      phone: lead.phone || '',
      secondPhone: lead.secondPhone || '',
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
      enrolled: lead.enrolled || '',
      notes: lead.notes || ''
    };

    return baseFormData;
  };

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
      // ← NEW: Delete custom fields for selected leads first
      for (const leadId of selectedLeads) {
        try {
          await settingsService.deleteAllCustomFieldsForLead(leadId);
        } catch (error) {
          console.error('Error deleting custom fields for lead', leadId, error);
          // Continue with lead deletion even if custom fields deletion fails
        }
      }

      // Delete the leads themselves
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

  // ← UPDATED: Clear selections when leads data changes (after filters/search/me toggle)
  useEffect(() => {
    setSelectedLeads([]);
    setSelectAll(false);
  }, [searchTerm, counsellorFilters, stageFilters, statusFilters, alertFilter]); // ← NEW: Include alertFilter

  // ← UPDATED: Calculate stage counts using stage_key for ENROLLED LEADS ONLY
  const getStageCount = (stageName) => {
    const stageKey = getStageKeyFromName(stageName);
    return leadsData.filter(lead => {
      const leadStageKey = getStageKeyForLead(lead.stage);
      const isEnrolledLead = lead.category === 'Enrolled';
      return isEnrolledLead && (leadStageKey === stageKey || lead.stage === stageName);
    }).length;
  };

  // ← UPDATED: Get stage color using stage_key
  const getStageColorFromSettings = (stageValue) => {
    const stageKey = getStageKeyForLead(stageValue);
    return getStageColor(stageKey);
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

  // ← UPDATED: Fetch leads from Supabase with custom fields support
  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Make both API calls in parallel using the fast view
      const [leadsResponse, activityResponse] = await Promise.all([
        supabase.from('Leads').select('*').order('id', { ascending: false }),
        supabase.from('last_activity_by_lead').select('*')  // Use the view
      ]);

      if (leadsResponse.error) throw leadsResponse.error;
      if (activityResponse.error) throw activityResponse.error;

      // ← NEW: Process leads data with custom fields (this will be slower initially)
      console.log('Converting leads data with custom fields...');
      const convertedData = await Promise.all(
        leadsResponse.data.map(convertDatabaseToUIWithCustomFields)
      );
      console.log('Leads data converted with custom fields');
      
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

  // ← UPDATED: openSidebar with field_key support
  const openSidebar = (lead) => {
    console.log('Opening sidebar for lead:', lead);
    setSelectedLead(lead);
    
    // Use the new function to setup form data
    const formData = setupSidebarFormDataWithCustomFields(lead);
    setSidebarFormData(formData);
    
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

  // ← UPDATED: Handle stage change from sidebar with stage_key support
  const handleSidebarStageChange = async (leadId, newStageKey) => {
    try {
      const lead = leadsData.find(l => l.id === leadId);
      const oldStageKey = lead.stage;
      const updatedScore = getStageScore(newStageKey);
      const updatedCategory = getStageCategory(newStageKey);
      
      // Get display names for logging
      const oldStageName = getStageDisplayName(oldStageKey);
      const newStageName = getStageDisplayName(newStageKey);
      
      // Log the stage change FIRST (before database update)
      if (oldStageKey !== newStageKey) {
        await logStageChange(leadId, oldStageName, newStageName, 'sidebar');
      }

      // ← UPDATED: Store stage_key in database instead of stage name
      let updateData = { 
        stage: newStageKey, // ← Store stage_key
        score: updatedScore, 
        category: updatedCategory,
        updated_at: new Date().toISOString()
      };

      // Handle 'No Response' logic with stage_key
      const noResponseKey = getStageKeyFromName('No Response');
      if (newStageKey === noResponseKey && oldStageKey !== noResponseKey) {
        updateData.previous_stage = oldStageKey;
      }

      if (oldStageKey === noResponseKey && newStageKey !== noResponseKey) {
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
          ? { 
              ...lead, 
              stage: newStageKey, 
              stageDisplayName: newStageName,
              score: updatedScore, 
              category: updatedCategory 
            }
          : lead
      );
      
      setLeadsData(updatedLeads);

      // Update selected lead if it's the one being changed
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({
          ...selectedLead,
          stage: newStageKey,
          stageDisplayName: newStageName,
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

  // ← UPDATED: Handle update all fields function with field_key and stage_key support
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
      
      // ← UPDATED: Handle stage_key in updates
      const stageKey = getStageKeyForLead(sidebarFormData.stage);
      
      // ← UPDATED: Prepare the update data with field_key awareness
      const updateData = {
        parents_name: sidebarFormData.parentsName,
        kids_name: sidebarFormData.kidsName,
        grade: sidebarFormData.grade,
        source: sidebarFormData.source,
        phone: formattedPhone,
        second_phone: sidebarFormData.secondPhone,
        stage: stageKey, // ← Store stage_key
        score: getStageScore(stageKey),
        category: getStageCategory(stageKey),
        counsellor: sidebarFormData.counsellor,
        offer: sidebarFormData.offer,
        email: sidebarFormData.email,
        occupation: sidebarFormData.occupation,
        location: sidebarFormData.location,
        current_school: sidebarFormData.currentSchool,
        meet_link: sidebarFormData.meetingLink,
        visit_location: sidebarFormData.visitLocation,
        reg_fees: sidebarFormData.registrationFees,
        enrolled: sidebarFormData.enrolled,
        notes: sidebarFormData.notes, // ← Added notes field
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
      const oldStageKey = selectedLead.stage;
      const newStageKey = stageKey;
      
      // Log stage change if it occurred
      if (oldStageKey !== newStageKey) {
        const oldStageName = getStageDisplayName(oldStageKey);
        const newStageName = getStageDisplayName(newStageKey);
        await logStageChange(selectedLead.id, oldStageName, newStageName, 'sidebar edit all');
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

      // ← UPDATED: Refresh the leads data (this will include custom fields)
      await fetchLeads();

      // Exit edit mode
      setIsEditingMode(false);

      // ← USE CONTEXT to update the lead state instead of manual setState
      updateCompleteLeadData(selectedLead.id, sidebarFormData, getStageScore, getStageCategory);

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

  // ← UPDATED: Handle stage change from dropdown with stage_key support
  const handleStageChangeFromDropdown = async (e, leadId, newStageKey) => {
    e.stopPropagation();
    
    try {
      const lead = leadsData.find(l => l.id === leadId);
      const oldStageKey = lead.stage;
      const updatedScore = getStageScore(newStageKey);
      const updatedCategory = getStageCategory(newStageKey);
      
      // Get display names for logging
      const oldStageName = getStageDisplayName(oldStageKey);
      const newStageName = getStageDisplayName(newStageKey);
      
      // Log the stage change FIRST (before database update)
      if (oldStageKey !== newStageKey) {
        await logStageChange(leadId, oldStageName, newStageName, 'table dropdown');
      }

      // ← UPDATED: Store stage_key in database
      let updateData = { 
        stage: newStageKey, // ← Store stage_key
        score: updatedScore, 
        category: updatedCategory,
        updated_at: new Date().toISOString()
      };

      // Handle 'No Response' logic with stage_key
      const noResponseKey = getStageKeyFromName('No Response');
      if (newStageKey === noResponseKey && oldStageKey !== noResponseKey) {
        updateData.previous_stage = oldStageKey;
      }

      if (oldStageKey === noResponseKey && newStageKey !== noResponseKey) {
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
          ? { 
              ...lead, 
              stage: newStageKey, 
              stageDisplayName: newStageName,
              score: updatedScore, 
              category: updatedCategory 
            }
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
  const handleAddLead = async (action = 'add') => {
    await fetchLeads(); // Refresh leads data (already includes activity data and custom fields)
    
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

  const handleShowImportModal = () => {
    setShowImportModal(true);
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
  };

  const handleImportComplete = async () => {
    await fetchLeads();
    setShowImportModal(false);
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

  // ← UPDATED: Search functionality with field_key support
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
        getStageDisplayName(lead.stage).toLowerCase().includes(term.toLowerCase()) ||
        lead.counsellor.toLowerCase().includes(term.toLowerCase()) ||
        (lead.email && lead.email.toLowerCase().includes(term.toLowerCase())) ||
        (lead.occupation && lead.occupation.toLowerCase().includes(term.toLowerCase())) ||
        (lead.location && lead.location.toLowerCase().includes(term.toLowerCase())) ||
        (lead.currentSchool && lead.currentSchool.toLowerCase().includes(term.toLowerCase())) ||
        (lead.source && lead.source.toLowerCase().includes(term.toLowerCase()))
      );
      setFilteredLeads(filtered);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredLeads([]);
    setShowSearch(false);
  };

  // ← UPDATED: Determine which data to display - FILTER FOR ENROLLED LEADS ONLY
  const getDisplayLeads = () => {
    // First filter for enrolled leads only
    let filtered = leadsData.filter(lead => lead.category === 'Enrolled');
    
    // Apply search
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(lead => 
        lead.parentsName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.kidsName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getStageDisplayName(lead.stage).toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.counsellor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.occupation && lead.occupation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.location && lead.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.currentSchool && lead.currentSchool.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.source && lead.source.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply filters
    return applyFilters(filtered, counsellorFilters, stageFilters, statusFilters, alertFilter, getStageDisplayName, getStageKeyFromName, getDaysSinceLastActivity);
  };

  const displayLeads = getDisplayLeads();

  // ← Get enrolled leads count for header
  const enrolledLeadsCount = leadsData.filter(lead => lead.category === 'Enrolled').length;

  // Format phone for mobile display (remove +91 prefix)
  const formatPhoneForMobile = (phone) => {
    if (!phone) return '';
    return phone.replace('+91', '').trim();
  };

  // Check if screen is mobile (optional - for conditional rendering)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show loading if either leads or settings are loading
  if (loading || settingsLoading) {
    return (
      <div className="nova-crm" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="nova-main">
          <div className="loading-message">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nova-crm" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Left Sidebar */}
      <LeftSidebar 
        activeNavItem="leads"
        activeSubmenuItem="enrolled"
        stages={stages}
        getStageCount={getStageCount}
        stagesTitle="Enrolled Stages"
        stagesIcon={Play}
        onLogout={onLogout}
        user={user}
      />

      {/* Main Content */}
      <div className="nova-main">
        {/* Header */}
        
        <div className="nova-header">
          <div className="header-left">
            <div className="header-title-row">
              <h1>Enrolled Leads</h1>
            </div>
            <span className="total-count">
              Enrolled Leads {enrolledLeadsCount}
            </span>
            
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
  {/* Desktop View - Original Layout */}
  <div className="desktop-header-actions">
    <div className="search-container">
      <Search size={16} className="search-icon" />
      <input
        type="text"
        placeholder="Search enrolled leads..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="search-input"
      />
    </div>
    {/* ← UPDATED: FilterButton with alert filter props */}
    <FilterButton
      showFilter={showFilter}
      setShowFilter={setShowFilter}
      counsellorFilters={counsellorFilters}
      stageFilters={stageFilters}
      statusFilters={statusFilters}
      alertFilter={alertFilter} // ← NEW: Alert filter
      setCounsellorFilters={setCounsellorFilters}
      setStageFilters={setStageFilters}
      setStatusFilters={setStatusFilters}
      setAlertFilter={setAlertFilter} // ← NEW: Alert filter setter
      settingsData={settingsData} 
      getFieldLabel={getFieldLabel}
      getStageKeyFromName={getStageKeyFromName}
      getStageDisplayName={getStageDisplayName}
    />
    <button 
      className="import-leads-btn" 
      onClick={handleShowImportModal}
      title="Import Leads"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#059669';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#10b981';
      }}
    >
      <Plus size={20} />
    </button>
    <button className="add-lead-btn" onClick={handleShowAddForm}>
      + Add Lead
    </button>
  </div>

  {/* Mobile View - Dropdown */}
  <div className="mobile-header-actions">
    {/* ← UPDATED: MobileHeaderDropdown with alert filter props */}
    <MobileHeaderDropdown
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      showFilter={showFilter}
      setShowFilter={setShowFilter}
      counsellorFilters={counsellorFilters}
      stageFilters={stageFilters}
      statusFilters={statusFilters}
      alertFilter={alertFilter} // ← NEW: Alert filter
      setCounsellorFilters={setCounsellorFilters}
      setStageFilters={setStageFilters}
      setStatusFilters={setStatusFilters}
      setAlertFilter={setAlertFilter} // ← NEW: Alert filter setter
      settingsData={settingsData}
      getFieldLabel={getFieldLabel}
      getStageKeyFromName={getStageKeyFromName}
      getStageDisplayName={getStageDisplayName}
      onShowImportModal={handleShowImportModal}
      onShowAddForm={handleShowAddForm}
      FilterButton={FilterButton}
    />
  </div>
</div>

        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <AlertCircle size={16} /> Error: {error}
          </div>
        )}

        {/* ← UPDATED: Leads Table with field_key support for headers */}
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
                <th>Parent</th> {/* Shortened for mobile */}
                <th>Phone</th>
                <th className="desktop-only">{getFieldLabel('grade')}</th> {/* Will be hidden on mobile */}
                <th>Stage</th>
                <th className="desktop-only">Status</th> {/* Will be hidden on mobile */}
                <th className="desktop-only">{getFieldLabel('counsellor')}</th> {/* Will be hidden on mobile */}
                <th>Alert</th>
              </tr>
            </thead>
            <tbody>
              {!loading && displayLeads.length > 0 ? (
                displayLeads.map(lead => (
                  <tr 
                    key={lead.id} 
                    onClick={() => openSidebar(lead)} 
                    className="table-row mobile-tap-row"
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
                    <td>{formatPhoneForMobile(lead.phone)}</td>
                    <td>{lead.grade}</td>
                    <td>
                      <div className="stage-dropdown-container" style={{ position: 'relative', width: '100%' }}>
                        <div 
                          className="stage-badge stage-dropdown-trigger" 
                          style={{ 
                            backgroundColor: getStageColorFromSettings(lead.stage), 
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
                          {/* ← UPDATED: Show display name instead of stage_key */}
                          <span style={{ fontWeight: '600' }}>{getStageDisplayName(lead.stage)}</span>
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
                        
                        {/* ← UPDATED: Dynamic Stage Dropdown with stage_key values */}
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
                                onClick={(e) => handleStageChangeFromDropdown(e, lead.id, stage.value)} // ← Pass stage_key
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
                                <span style={{ flex: 1 }}>{stage.label}</span> {/* ← Display stage name */}
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
                  {searchTerm 
                    ? 'No enrolled leads found for your search.' 
                    : 'No enrolled leads available. Enrolled leads will appear here when their status changes to "Enrolled".'}
                </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* ← Lead Sidebar Component with field_key and stage_key support */}
      <LeadSidebar
        key={selectedLead?.id}
        showSidebar={showSidebar}
        selectedLead={selectedLead}
        isEditingMode={isEditingMode}
        sidebarFormData={sidebarFormData}
        stages={stages}
        settingsData={settingsData}
        onClose={closeSidebar}
        onEditModeToggle={handleEditModeToggle}
        onFieldChange={handleSidebarFieldChange}
        onUpdateAllFields={handleUpdateAllFields}
        onStageChange={handleSidebarStageChange}
        onRefreshActivityData={fetchLastActivityData}
        getStageColor={getStageColorFromSettings}
        getCounsellorInitials={getCounsellorInitials}
        getScoreFromStage={getStageScore}
        getCategoryFromStage={getStageCategory}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        selectedLeads={selectedLeads}
        leadsData={leadsData}
      />

      {/* Add Lead Form with field_key and stage_key support */}
      {showAddForm && (
        <AddLeadForm
          isOpen={showAddForm}
          onClose={handleCloseAddForm}
          onSubmit={handleAddLead}
          existingLeads={leadsData}
          settingsData={settingsData}
        />
      )}

      {/* Import Leads Modal */}
      {showImportModal && (
        <ImportLeadsModal
          isOpen={showImportModal}
          onClose={handleCloseImportModal}
          onComplete={handleImportComplete}
        />
      )}
    </div>
  );
};

export default EnrolledLeads;