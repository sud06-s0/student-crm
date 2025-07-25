import React, { useState, useEffect } from 'react';
import novalogo from '../NovaLogo.jpg';
import { 
  Edit, 
  Plus, 
  Check, 
  X, 
  Upload,
  ArrowUpDown,
  Settings,
  Loader2
} from 'lucide-react';
import LeftSidebar from './LeftSidebar';
import { settingsService } from '../services/settingsService';

const SettingsPage = ({ onLogout, user }) => {
  // Database states
  const [settingsData, setSettingsData] = useState({
    stages: [],
    grades: [],
    counsellors: [],
    sources: [],
    form_fields: [],
    school: {}
  });

  const [showStageEditModal, setShowStageEditModal] = useState(false);
  const [editingStage, setEditingStage] = useState({
    id: null,
    name: '',
    color: '',
    status: ''
  });
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // School Profile State
  const [schoolProfile, setSchoolProfile] = useState({
    schoolName: '',
    academicYearFrom: '',
    academicYearTo: ''
  });

  // Custom Fields Modal State
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [customFieldData, setCustomFieldData] = useState({
    fieldName: '',
    fieldType: 'text',
    
  });

  // New item input states
  const [newCounsellor, setNewCounsellor] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [showNewCounsellorInput, setShowNewCounsellorInput] = useState(false);
  const [showNewSourceInput, setShowNewSourceInput] = useState(false);
  const [showNewGradeInput, setShowNewGradeInput] = useState(false);

  // Editing states
  const [editingItems, setEditingItems] = useState({});

  // Field type options for custom fields
  const fieldTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'numeric', label: 'Numeric' }
  ];

  // Stage editing functions
  const handleEditStage = (stage) => {
    setEditingStage({
      id: stage.id,
      name: stage.name,
      color: stage.color || '#B3D7FF',
      status: stage.status || 'New'
    });
    setShowStageEditModal(true);
  };

  const handleUpdateStage = async () => {
    try {
      await settingsService.updateItem(editingStage.id, editingStage.name, {
        color: editingStage.color,
        status: editingStage.status,
        score: 20,
        category: 'New'
      });
      await loadSettings();
      setShowStageEditModal(false);
      alert('Stage updated successfully!');
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Error updating stage: ' + error.message);
    }
  };

  const moveStageUp = async (stageId) => {
    try {
      await settingsService.moveStage(stageId, 'up');
      await loadSettings();
    } catch (error) {
      console.error('Error moving stage:', error);
      alert('Error moving stage: ' + error.message);
    }
  };

  const moveStageDown = async (stageId) => {
    try {
      await settingsService.moveStage(stageId, 'down');
      await loadSettings();
    } catch (error) {
      console.error('Error moving stage:', error);
      alert('Error moving stage: ' + error.message);
    }
  };

  // Load data from database
  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getAllSettings();
      setSettingsData(data);
      
      // Set school profile
      setSchoolProfile({
        schoolName: data.school.school_name || '',
        academicYearFrom: data.school.academic_year_from || '',
        academicYearTo: data.school.academic_year_to || ''
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      alert('Error loading settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Handle school profile changes
  const handleSchoolProfileChange = (field, value) => {
    setSchoolProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // FORM FIELDS CRUD OPERATIONS
  const addNewFormField = async () => {
    if (customFieldData.fieldName.trim()) {
      try {
        // Check custom fields count (only the 5 additional ones)
        const customFieldsCount = await settingsService.getCustomFormFieldsCount();
        
        if (customFieldsCount >= 5) {
          alert('Maximum 5 additional custom fields allowed!');
          return;
        }
              
        const fieldTypeLabel = fieldTypeOptions.find(opt => opt.value === customFieldData.fieldType)?.label || 'Text';
        
        await settingsService.createItem('form_fields', customFieldData.fieldName, {
          field_type: fieldTypeLabel,
          mandatory: customFieldData.mandatory,
          is_default: false,
          is_custom: true
        });
              
        await loadSettings();
        setCustomFieldData({ fieldName: '', fieldType: 'text', mandatory: false });
        setShowCustomFieldModal(false);
        alert('Form field added successfully!');
      } catch (error) {
        console.error('Error adding form field:', error);
        alert('Error adding form field: ' + error.message);
      }
    }
  };

  // Toggle stage status
  const toggleStageStatus = async (stageId) => {
    try {
      await settingsService.toggleItemStatus(stageId);
      await loadSettings();
      alert('Stage status updated successfully!');
    } catch (error) {
      console.error('Error updating stage status:', error);
      alert('Error updating stage status: ' + error.message);
    }
  };

  // Toggle form field status (only for custom fields)
  const toggleFormFieldStatus = async (fieldId) => {
    try {
      await settingsService.toggleItemStatus(fieldId);
      await loadSettings();
      alert('Field status updated successfully!');
    } catch (error) {
      console.error('Error updating field status:', error);
      alert('Error updating field status: ' + error.message);
    }
  };

  // Add state for dropdown options
  const [showDropdownOptionsModal, setShowDropdownOptionsModal] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState(['']);
  const [editingFieldId, setEditingFieldId] = useState(null);

  // Handle dropdown options
  const handleDropdownOptionsChange = (index, value) => {
    const newOptions = [...dropdownOptions];
    newOptions[index] = value;
    setDropdownOptions(newOptions);
  };

  const addDropdownOption = () => {
    setDropdownOptions([...dropdownOptions, '']);
  };

  const removeDropdownOption = (index) => {
    if (dropdownOptions.length > 1) {
      const newOptions = dropdownOptions.filter((_, i) => i !== index);
      setDropdownOptions(newOptions);
    }
  };

  const saveDropdownOptions = async () => {
    try {
      const field = settingsData.form_fields.find(f => f.id === editingFieldId);
      const validOptions = dropdownOptions.filter(opt => opt.trim() !== '');
      
      if (validOptions.length === 0) {
        alert('Please add at least one option');
        return;
      }

      await settingsService.updateItem(editingFieldId, field.name, {
        field_type: field.field_type,
        mandatory: field.mandatory,
        is_default: field.is_default || false,
        dropdown_options: validOptions
      });
      
      await loadSettings();
      setShowDropdownOptionsModal(false);
      setDropdownOptions(['']);
      setEditingFieldId(null);
      alert('Dropdown options updated successfully!');
    } catch (error) {
      console.error('Error updating dropdown options:', error);
      alert('Error updating dropdown options: ' + error.message);
    }
  };

  const openDropdownOptionsModal = (fieldId) => {
    const field = settingsData.form_fields.find(f => f.id === fieldId);
    setEditingFieldId(fieldId);
    setDropdownOptions(field.dropdown_options || ['']);
    setShowDropdownOptionsModal(true);
  };

  const toggleFieldMandatory = async (fieldId) => {
    try {
      const field = settingsData.form_fields.find(f => f.id === fieldId);
      if (field && settingsService.canChangeMandatoryStatus(field.name)) {
        await settingsService.updateItem(fieldId, field.name, {
          field_type: field.field_type,
          mandatory: !field.mandatory,
          is_default: field.is_default || false,
          dropdown_options: field.dropdown_options
        });
        await loadSettings();
        alert('Field updated successfully!');
      }
    } catch (error) {
      console.error('Error updating field:', error);
      alert('Error updating field: ' + error.message);
    }
  };

  const removeCustomField = async (fieldId) => {
    const field = settingsData.form_fields.find(f => f.id === fieldId);
    if (field && settingsService.isFieldDeletable(field.name)) {
      if (window.confirm('Are you sure you want to delete this field?')) {
        try {
          await settingsService.deleteItem(fieldId);
          await loadSettings();
          alert('Field deleted successfully!');
        } catch (error) {
          console.error('Error deleting field:', error);
          alert('Error deleting field: ' + error.message);
        }
      }
    }
  };

  // Toggle field name editing
  const toggleFieldNameEdit = (id) => {
    setEditingItems(prev => ({
      ...prev,
      [`field_name_${id}`]: !prev[`field_name_${id}`]
    }));
  };

  // Handle field name change
  const handleFieldNameChange = async (id, newName) => {
    try {
      const field = settingsData.form_fields.find(f => f.id === id);
      await settingsService.updateItem(id, newName, {
        field_type: field.field_type,
        mandatory: field.mandatory,
        is_default: field.is_default || false,
        dropdown_options: field.dropdown_options
      });
      await loadSettings();
      setEditingItems(prev => ({
        ...prev,
        [`field_name_${id}`]: false
      }));
      alert('Field name updated successfully!');
    } catch (error) {
      console.error('Error updating field name:', error);
      alert('Error updating field name: ' + error.message);
    }
  };

  // COUNSELLORS CRUD OPERATIONS
  const addNewCounsellor = async () => {
    if (newCounsellor.trim()) {
      try {
        await settingsService.createItem('counsellors', newCounsellor);
        await loadSettings();
        setNewCounsellor('');
        setShowNewCounsellorInput(false);
        alert('Counsellor added successfully!');
      } catch (error) {
        console.error('Error adding counsellor:', error);
        alert('Error adding counsellor: ' + error.message);
      }
    }
  };

  const toggleCounsellorEdit = (id) => {
    setEditingItems(prev => ({
      ...prev,
      [`counsellor_${id}`]: !prev[`counsellor_${id}`]
    }));
  };

  const handleCounsellorNameChange = async (id, newName) => {
    try {
      await settingsService.updateItem(id, newName);
      await loadSettings();
      setEditingItems(prev => ({
        ...prev,
        [`counsellor_${id}`]: false
      }));
      alert('Counsellor updated successfully!');
    } catch (error) {
      console.error('Error updating counsellor:', error);
      alert('Error updating counsellor: ' + error.message);
    }
  };

  const removeCounsellor = async (counsellorId) => {
    if (window.confirm('Are you sure you want to delete this counsellor?')) {
      try {
        await settingsService.deleteItem(counsellorId);
        await loadSettings();
        alert('Counsellor deleted successfully!');
      } catch (error) {
        console.error('Error deleting counsellor:', error);
        alert('Error deleting counsellor: ' + error.message);
      }
    }
  };

  // SOURCES CRUD OPERATIONS
  const addNewSource = async () => {
    if (newSource.trim()) {
      try {
        await settingsService.createItem('sources', newSource);
        await loadSettings();
        setNewSource('');
        setShowNewSourceInput(false);
        alert('Source added successfully!');
      } catch (error) {
        console.error('Error adding source:', error);
        alert('Error adding source: ' + error.message);
      }
    }
  };

  const toggleSourceEdit = (id) => {
    setEditingItems(prev => ({
      ...prev,
      [`source_${id}`]: !prev[`source_${id}`]
    }));
  };

  const handleSourceNameChange = async (id, newName) => {
    try {
      await settingsService.updateItem(id, newName);
      await loadSettings();
      setEditingItems(prev => ({
        ...prev,
        [`source_${id}`]: false
      }));
      alert('Source updated successfully!');
    } catch (error) {
      console.error('Error updating source:', error);
      alert('Error updating source: ' + error.message);
    }
  };

  const removeSource = async (sourceId) => {
    if (window.confirm('Are you sure you want to delete this source?')) {
      try {
        await settingsService.deleteItem(sourceId);
        await loadSettings();
        alert('Source deleted successfully!');
      } catch (error) {
        console.error('Error deleting source:', error);
        alert('Error deleting source: ' + error.message);
      }
    }
  };

  // GRADES CRUD OPERATIONS
  const addNewGrade = async () => {
    if (newGrade.trim()) {
      try {
        await settingsService.createItem('grades', newGrade);
        await loadSettings();
        setNewGrade('');
        setShowNewGradeInput(false);
        alert('Grade added successfully!');
      } catch (error) {
        console.error('Error adding grade:', error);
        alert('Error adding grade: ' + error.message);
      }
    }
  };

  const toggleGradeEdit = (id) => {
    setEditingItems(prev => ({
      ...prev,
      [`grade_${id}`]: !prev[`grade_${id}`]
    }));
  };

  const handleGradeNameChange = async (id, newName) => {
    try {
      await settingsService.updateItem(id, newName);
      await loadSettings();
      setEditingItems(prev => ({
        ...prev,
        [`grade_${id}`]: false
      }));
      alert('Grade updated successfully!');
    } catch (error) {
      console.error('Error updating grade:', error);
      alert('Error updating grade: ' + error.message);
    }
  };

  const removeGrade = async (gradeId) => {
    if (window.confirm('Are you sure you want to delete this grade?')) {
      try {
        await settingsService.deleteItem(gradeId);
        await loadSettings();
        alert('Grade deleted successfully!');
      } catch (error) {
        console.error('Error deleting grade:', error);
        alert('Error deleting grade: ' + error.message);
      }
    }
  };

  // Handle save settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await settingsService.updateSchoolSettings({
        school_name: schoolProfile.schoolName,
        academic_year_from: schoolProfile.academicYearFrom,
        academic_year_to: schoolProfile.academicYearTo
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="nova-crm" style={{ fontFamily: 'Inter, sans-serif' }}>
        <LeftSidebar 
          activeNavItem="settings"
          onLogout={onLogout}
          user={user}
        />
        <div className="nova-main">
          <div className="settings-container">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <Loader2 size={32} className="animate-spin" />
              <span style={{ marginLeft: '12px', fontSize: '18px' }}>Loading settings...</span>
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
        activeNavItem="settings"
        onLogout={onLogout}
        user={user}
      />

      {/* Main Content */}
      <div className="nova-main">
        <div className="settings-container">
          <div className="settings-header">
            <Settings size={24} />
            <h1>Settings</h1>
          </div>

          {/* School Profile Section */}
          <div className="settings-section">
            <h2>School Profile</h2>
            <div className="settings-section-content">
              <div className="settings-school-profile">
                <div className="settings-logo-section">
                  <div className="settings-logo-placeholder">
                    <img 
                      src={novalogo} 
                      alt="NOVA International School" 
                      className="logo-image"
                      style={{
                        width: '100%',
                        maxWidth: '180px',
                        height: 'auto',
                        marginBottom: '20px',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>
                <div className="settings-profile-fields">
                  <div className="settings-field-group">
                    <label>School Name</label>
                    <input
                      type="text"
                      value={schoolProfile.schoolName}
                      onChange={(e) => handleSchoolProfileChange('schoolName', e.target.value)}
                      placeholder="Enter school name"
                    />
                  </div>
                  
                  <div className="settings-field-row">
                    <div className="settings-field-group">
                      <label>Academic Year</label>
                      <div className="settings-year-inputs">
                        <input
                          type="text"
                          value={schoolProfile.academicYearFrom}
                          onChange={(e) => handleSchoolProfileChange('academicYearFrom', e.target.value)}
                          placeholder="From"
                        />
                        <span>To</span>
                        <input
                          type="text"
                          value={schoolProfile.academicYearTo}
                          onChange={(e) => handleSchoolProfileChange('academicYearTo', e.target.value)}
                          placeholder="To"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Update Button */}
          <div className="settings-footer">
            <button 
              className="settings-update-btn" 
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Update School Profile
                </>
              )}
            </button>
          </div>
            </div>
            
          </div>
           
           {/*Two column section*/}
           <div className='settings-two-column-row'>                    
          {/* Lead Form Fields Section */}
          <div className="settings-section">
            <h2>Lead Form Fields</h2>
            <div className="settings-section-content">
              <div className="settings-table-container">
                <table className="settings-table">
                  <thead>
                    <tr>
                      <th>Field Name</th>
                      <th>Field Type</th>
                      <th>Mandatory</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settingsData.form_fields.map((field) => {
                      const isSuperConstant = settingsService.isSuperConstantField(field.name);
                      const isConstant = settingsService.isConstantField(field.name);
                      const isCustom = settingsService.isCustomField(field.name);
                      
                      return (
                        <tr key={field.id} style={{ opacity: (isCustom && !field.is_active) ? 0.5 : 1 }}>
                          <td>
                            {editingItems[`field_name_${field.id}`] && (isConstant || isCustom) ? (
                              <input
                                type="text"
                                defaultValue={field.name}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleFieldNameChange(field.id, e.target.value);
                                  }
                                }}
                                onBlur={(e) => handleFieldNameChange(field.id, e.target.value)}
                              />
                            ) : (
                              <span>{field.name}</span>
                            )}
                            {field.field_type === 'Dropdown' && field.dropdown_options && (
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                Options: {field.dropdown_options.join(', ')}
                              </div>
                            )}
                          </td>
                          <td>
                            {field.field_type}
                            {field.field_type === 'Dropdown' && isCustom && field.is_active && (
                              <button
                                className="settings-edit-dropdown-btn"
                                onClick={() => openDropdownOptionsModal(field.id)}
                                style={{ marginLeft: '8px', fontSize: '12px', padding: '2px 6px' }}
                              >
                                Edit Options
                              </button>
                            )}
                          </td>
                          <td>
                              {settingsService.canChangeMandatoryStatus(field.name) ? (
                                <button
                                  className={`settings-mandatory-toggle ${field.mandatory ? 'active' : ''}`}
                                  onClick={() => toggleFieldMandatory(field.id)}
                                >
                                  {field.mandatory ? <Check size={16} /> : <X size={16} />}
                                </button>
                              ) : (
                                <span style={{ color: '#999', fontSize: '14px' }}>N/A</span>
                              )}
                            </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {/* ON/OFF Toggle - Only for custom fields */}
                              {isCustom && (
                                <button
                                  className={`settings-toggle-btn ${field.is_active ? 'active' : 'inactive'}`}
                                  onClick={() => toggleFormFieldStatus(field.id)}
                                >
                                  {field.is_active ? 'ON' : 'OFF'}
                                </button>
                              )}
                              
                              {/* Edit Name Button - For constant and custom fields */}
                              {(isConstant || isCustom) && (
                                <button 
                                  className="settings-edit-btn"
                                  onClick={() => toggleFieldNameEdit(field.id)}
                                  disabled={isCustom && !field.is_active}
                                >
                                  <Edit size={16} />
                                </button>
                              )}
                              
                              {/* Delete Button - Only for custom fields */}
                              {isCustom && (
                                <button
                                  className="settings-remove-btn"
                                  onClick={() => removeCustomField(field.id)}
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                <div className="settings-add-custom-section">
                  <h3>Add Custom Fields</h3>
                  <button 
                    className="settings-add-btn"
                    onClick={() => setShowCustomFieldModal(true)}
                  >
                    <Plus size={16} />
                    Add Field
                  </button>
                </div>
              </div>
            </div>
          </div>

                  
          {/* Lead Stages Section */}
          <div className="settings-section">
            <h2>Lead Stages</h2>
            <div className="settings-section-content">
              <div className="settings-table-container">
                <table className="settings-table">
                  <thead>
                    <tr>
                      <th>Move</th>
                      <th>Stage Name</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settingsData.stages.map((stage, index) => (
                      <tr key={stage.id} style={{ opacity: stage.is_active ? 1 : 0.5 }}>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="settings-move-btn"
                              onClick={() => moveStageUp(stage.id)}
                              disabled={index === 0 || !stage.is_active}
                              style={{ opacity: (index === 0 || !stage.is_active) ? 0.3 : 1 }}
                            >
                              ↑
                            </button>
                            <button
                              className="settings-move-btn"
                              onClick={() => moveStageDown(stage.id)}
                              disabled={index === settingsData.stages.length - 1 || !stage.is_active}
                              style={{ opacity: (index === settingsData.stages.length - 1 || !stage.is_active) ? 0.3 : 1 }}
                            >
                              ↓
                            </button>
                          </div>
                        </td>
                        <td>
                          <div 
                            className="settings-stage-name-badge"
                            style={{ backgroundColor: stage.color }}
                          >
                            {stage.name}
                          </div>
                        </td>
                        <td>
                          <span className="settings-stage-status">{stage.status || 'New'}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className={`settings-toggle-btn ${stage.is_active ? 'active' : 'inactive'}`}
                              onClick={() => toggleStageStatus(stage.id)}
                            >
                              {stage.is_active ? 'ON' : 'OFF'}
                            </button>
                            <button 
                              className="settings-edit-btn"
                              onClick={() => handleEditStage(stage)}
                              disabled={!stage.is_active}
                            >
                              <Edit size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stage Edit Modal */}
            {showStageEditModal && (
              <>
                <div className="settings-modal-overlay" onClick={() => setShowStageEditModal(false)}></div>
                <div className="settings-modal">
                  <div className="settings-modal-header">
                    <h3>Edit Stage</h3>
                    <button 
                      className="settings-modal-close"
                      onClick={() => setShowStageEditModal(false)}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="settings-modal-body">
                    <div className="settings-field-group">
                      <label>Stage Name</label>
                      <input
                        type="text"
                        value={editingStage.name}
                        onChange={(e) => setEditingStage(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="settings-field-group">
                      <label>Status</label>
                      <input
                        type="text"
                        value={editingStage.status}
                        onChange={(e) => setEditingStage(prev => ({ ...prev, status: e.target.value }))}
                      />
                    </div>
                    <div className="settings-field-group">
                      <label>Color</label>
                      <input
                        type="color"
                        value={editingStage.color}
                        onChange={(e) => setEditingStage(prev => ({ ...prev, color: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="settings-modal-footer">
                    <button 
                      className="settings-modal-submit"
                      onClick={handleUpdateStage}
                    >
                      Update Stage
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          </div> 

           {/* Two column section */}
           <div className='settings-two-column-row'>
          {/* Counsellors Section */}
          <div className="settings-section">
            <h2>Counsellors</h2>
            <div className="settings-section-content">
              <div className="settings-list-section">
                <div className="settings-add-new-section">
                  {!showNewCounsellorInput ? (
                    <button 
                      className="settings-add-new-btn"
                      onClick={() => setShowNewCounsellorInput(true)}
                    >
                      <Plus size={16} />
                      Add New
                    </button>
                  ) : (
                    <div className="settings-add-input-group">
                      <input
                        type="text"
                        value={newCounsellor}
                        onChange={(e) => setNewCounsellor(e.target.value)}
                        placeholder="Enter counsellor name"
                        onKeyPress={(e) => e.key === 'Enter' && addNewCounsellor()}
                      />
                      <button className="settings-submit-btn" onClick={addNewCounsellor}>
                        Submit
                      </button>
                      <button 
                        className="settings-cancel-btn" 
                        onClick={() => {
                          setShowNewCounsellorInput(false);
                          setNewCounsellor('');
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="settings-list-items">
                  {settingsData.counsellors.map((counsellor) => (
                    <div key={counsellor.id} className="settings-list-item">
                      <div className="settings-item-content">
                        <span className="settings-item-label">Counsellor Name</span>
                        {editingItems[`counsellor_${counsellor.id}`] ? (
                          <input
                            type="text"
                            defaultValue={counsellor.name}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleCounsellorNameChange(counsellor.id, e.target.value);
                              }
                            }}
                            onBlur={(e) => handleCounsellorNameChange(counsellor.id, e.target.value)}
                          />
                        ) : (
                          <span className="settings-item-value">{counsellor.name}</span>
                        )}
                      </div>
                      <div className="settings-item-actions">
                        <span className="settings-item-label">Edit</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="settings-edit-btn"
                            onClick={() => toggleCounsellorEdit(counsellor.id)}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="settings-remove-btn"
                            onClick={() => removeCounsellor(counsellor.id)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Lead Source Section */}
          <div className="settings-section">
            <h2>Lead Source</h2>
            <div className="settings-section-content">
              <div className="settings-list-section">
                <div className="settings-add-new-section">
                  {!showNewSourceInput ? (
                    <button 
                      className="settings-add-new-btn"
                      onClick={() => setShowNewSourceInput(true)}
                    >
                      <Plus size={16} />
                      Add New
                    </button>
                  ) : (
                    <div className="settings-add-input-group">
                      <input
                        type="text"
                        value={newSource}
                        onChange={(e) => setNewSource(e.target.value)}
                        placeholder="Enter source name"
                        onKeyPress={(e) => e.key === 'Enter' && addNewSource()}
                      />
                      <button className="settings-submit-btn" onClick={addNewSource}>
                        Submit
                      </button>
                      <button 
                        className="settings-cancel-btn" 
                        onClick={() => {
                          setShowNewSourceInput(false);
                          setNewSource('');
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="settings-list-items">
                  {settingsData.sources.map((source) => (
                    <div key={source.id} className="settings-list-item">
                      <div className="settings-item-content">
                        <span className="settings-item-label">Lead Source</span>
                        {editingItems[`source_${source.id}`] ? (
                          <input
                            type="text"
                            defaultValue={source.name}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSourceNameChange(source.id, e.target.value);
                              }
                            }}
                            onBlur={(e) => handleSourceNameChange(source.id, e.target.value)}
                          />
                        ) : (
                          <span className="settings-item-value">{source.name}</span>
                        )}
                      </div>
                      <div className="settings-item-actions">
                        <span className="settings-item-label">Edit</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="settings-edit-btn"
                            onClick={() => toggleSourceEdit(source.id)}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="settings-remove-btn"
                            onClick={() => removeSource(source.id)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grades Section */}
          <div className="settings-section">
            <h2>Grades</h2>
            <div className="settings-section-content">
              <div className="settings-list-section">
                <div className="settings-add-new-section">
                  {!showNewGradeInput ? (
                    <button 
                      className="settings-add-new-btn"
                      onClick={() => setShowNewGradeInput(true)}
                    >
                      <Plus size={16} />
                      Add New
                    </button>
                  ) : (
                    <div className="settings-add-input-group">
                      <input
                        type="text"
                        value={newGrade}
                        onChange={(e) => setNewGrade(e.target.value)}
                        placeholder="Enter grade name"
                        onKeyPress={(e) => e.key === 'Enter' && addNewGrade()}
                      />
                      <button className="settings-submit-btn" onClick={addNewGrade}>
                        Submit
                      </button>
                      <button 
                        className="settings-cancel-btn" 
                        onClick={() => {
                          setShowNewGradeInput(false);
                          setNewGrade('');
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="settings-list-items">
                  {settingsData.grades.map((grade) => (
                    <div key={grade.id} className="settings-list-item">
                      <div className="settings-item-content">
                        <span className="settings-item-label">Grade</span>
                        {editingItems[`grade_${grade.id}`] ? (
                          <input
                            type="text"
                            defaultValue={grade.name}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleGradeNameChange(grade.id, e.target.value);
                              }
                            }}
                            onBlur={(e) => handleGradeNameChange(grade.id, e.target.value)}
                          />
                        ) : (
                          <span className="settings-item-value">{grade.name}</span>
                        )}
                      </div>
                      <div className="settings-item-actions">
                        <span className="settings-item-label">Edit</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="settings-edit-btn"
                            onClick={() => toggleGradeEdit(grade.id)}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="settings-remove-btn"
                            onClick={() => removeGrade(grade.id)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </div> 

          

          {/* Custom Field Modal */}
          {showCustomFieldModal && (
            <>
              <div className="settings-modal-overlay" onClick={() => setShowCustomFieldModal(false)}></div>
              <div className="settings-modal">
                <div className="settings-modal-header">
                  <h3>Add Custom Field</h3>
                  <button 
                    className="settings-modal-close"
                    onClick={() => setShowCustomFieldModal(false)}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="settings-modal-body">
                  <div className="settings-field-group">
                    <label>Field Name</label>
                    <input
                      type="text"
                      value={customFieldData.fieldName}
                      onChange={(e) => setCustomFieldData(prev => ({ ...prev, fieldName: e.target.value }))}
                      placeholder="Enter field name"
                    />
                  </div>
                  
                  <div className="settings-field-group">
                    <label>Field Type</label>
                    <select
                      value={customFieldData.fieldType}
                      onChange={(e) => setCustomFieldData(prev => ({ ...prev, fieldType: e.target.value }))}
                    >
                      {fieldTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  
                </div>
                <div className="settings-modal-footer">
                  <button 
                    className="settings-modal-submit"
                    onClick={addNewFormField}
                  >
                    Add Field
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Dropdown Options Modal */}
          {showDropdownOptionsModal && (
            <>
              <div className="settings-modal-overlay" onClick={() => setShowDropdownOptionsModal(false)}></div>
              <div className="settings-modal">
                <div className="settings-modal-header">
                  <h3>Edit Dropdown Options</h3>
                  <button 
                    className="settings-modal-close"
                    onClick={() => setShowDropdownOptionsModal(false)}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="settings-modal-body">
                  {dropdownOptions.map((option, index) => (
                    <div key={index} className="settings-field-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleDropdownOptionsChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        style={{ flex: 1 }}
                      />
                      {dropdownOptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDropdownOption(index)}
                          className="settings-remove-btn"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addDropdownOption}
                    className="settings-add-btn"
                    style={{ marginTop: '12px' }}
                  >
                    <Plus size={16} />
                    Add Option
                  </button>
                </div>
                <div className="settings-modal-footer">
                  <button 
                    className="settings-modal-submit"
                    onClick={saveDropdownOptions}
                  >
                    Save Options
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;