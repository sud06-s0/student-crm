import { supabase } from '../lib/supabase';

export const settingsService = {
  // Get all settings
  async getAllSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('sort_order');
      
    if (error) throw error;
    
    // Group by type
    const grouped = {
      stages: [],
      grades: [],
      counsellors: [],
      sources: [],
      form_fields: [],
      school: {}
    };
    
    data?.forEach(item => {
      if (item.type === 'school') {
        grouped.school = item.value || {};
      } else if (grouped[item.type]) {
        grouped[item.type].push({
          id: item.id,
          name: item.name,
          field_key: item.field_key, // For form fields
          stage_key: item.stage_key, // ← NEW: For stages
          is_active: item.is_active, 
          ...(item.value || {}),
          sort_order: item.sort_order
        });
      } else {
        console.warn(`Unexpected item type: ${item.type}`, item);
      }
    });
    
    return grouped;
  },

  // ← NEW: Get stage by stage_key instead of name
  getStageByKey(stages, stageKey) {
    return stages.find(stage => stage.stage_key === stageKey);
  },

  // ← NEW: Get stage by name (for backwards compatibility)
  getStageByName(stages, stageName) {
    return stages.find(stage => stage.name === stageName);
  },

  // ← NEW: Create stage mapping from name to stage_key
  createStageNameToKeyMapping(stages) {
    const mapping = {};
    stages.forEach(stage => {
      if (stage.stage_key) {
        mapping[stage.name] = stage.stage_key;
      }
    });
    return mapping;
  },

  // ← NEW: Create stage mapping from stage_key to stage data
  createStageKeyToDataMapping(stages) {
    const mapping = {};
    stages.forEach(stage => {
      if (stage.stage_key) {
        mapping[stage.stage_key] = stage;
      }
    });
    return mapping;
  },

  // Toggle item active/inactive status
  async toggleItemStatus(id) {
    const { data: current, error: fetchError } = await supabase
      .from('settings')
      .select('is_active')
      .eq('id', id)
      .single();
      
    if (fetchError) throw fetchError;
    
    const { error } = await supabase
      .from('settings')
      .update({ is_active: !current.is_active })
      .eq('id', id);
      
    if (error) throw error;
  },

  // Get count of custom form fields
  async getCustomFormFieldsCount() {
    const { data, error } = await supabase
      .from('settings')
      .select('id, name, field_key')
      .eq('type', 'form_fields')
      .eq('is_active', true);
      
    if (error) throw error;
    
    const customFields = data?.filter(field => 
      this.isCustomFieldByKey(field.field_key)
    ) || [];
    
    return customFields.length;
  },

  // FORM FIELD FUNCTIONS (existing)
  isSuperConstantField(fieldName) {
    const superConstantFields = ['Parents Name', 'Kids Name', 'Phone', 'Email'];
    return superConstantFields.includes(fieldName);
  },

  isSuperConstantFieldByKey(fieldKey) {
    const superConstantKeys = ['parentsName', 'kidsName', 'phone', 'email'];
    return superConstantKeys.includes(fieldKey);
  },

  isConstantField(fieldName) {
    const exactConstantFields = [
      'Location', 'Occupation', 'Current School', 'Offer', 'Notes',
      'Meeting Date', 'Meeting Time', 'Meeting Link', 'Visit Date',
      'Visit Time', 'Visit Location', 'Registration Fees', 'Enrolled'
    ];
    return exactConstantFields.includes(fieldName);
  },

  isConstantFieldByKey(fieldKey) {
    const constantKeys = [
      'location', 'occupation', 'currentSchool', 'offer', 'notes',
      'meetingDate', 'meetingTime', 'meetingLink', 'visitDate',
      'visitTime', 'visitLocation', 'registrationFees', 'enrolled'
    ];
    return constantKeys.includes(fieldKey);
  },

  isCustomField(fieldName) {
    return !this.isSuperConstantField(fieldName) && !this.isConstantField(fieldName);
  },

  isCustomFieldByKey(fieldKey) {
    if (!fieldKey) return true;
    return !this.isSuperConstantFieldByKey(fieldKey) && !this.isConstantFieldByKey(fieldKey);
  },

  isFieldDeletable(fieldName) {
    return this.isCustomField(fieldName);
  },

  isFieldDeletableByKey(fieldKey) {
    return this.isCustomFieldByKey(fieldKey);
  },

  isFieldNameEditable(fieldName) {
    return this.isConstantField(fieldName) || this.isCustomField(fieldName);
  },

  isFieldNameEditableByKey(fieldKey) {
    return this.isConstantFieldByKey(fieldKey) || this.isCustomFieldByKey(fieldKey);
  },

  canToggleFieldStatus(fieldName) {
    return this.isCustomField(fieldName);
  },

  canToggleFieldStatusByKey(fieldKey) {
    return this.isCustomFieldByKey(fieldKey);
  },

  canChangeMandatoryStatus(fieldName) {
    return this.isSuperConstantField(fieldName);
  },

  canChangeMandatoryStatusByKey(fieldKey) {
    return this.isSuperConstantFieldByKey(fieldKey);
  },

  canEditDropdownOptions(fieldName) {
    return this.isCustomField(fieldName);
  },

  canEditDropdownOptionsByKey(fieldKey) {
    return this.isCustomFieldByKey(fieldKey);
  },

  // Create new item
  async createItem(type, name, additionalData = {}) {
    const maxOrder = await this.getMaxSortOrder(type);
    
    const insertData = {
      type,
      name,
      value: Object.keys(additionalData).length > 0 ? additionalData : null,
      sort_order: maxOrder + 1,
      is_active: true
    };

    const { data, error } = await supabase
      .from('settings')
      .insert([insertData])
      .select();
      
    if (error) throw error;
    return data[0];
  },

  // Update item
  async updateItem(id, name, additionalData = {}) {
    const updateData = { name };
    
    if (Object.keys(additionalData).length > 0) {
      updateData.value = additionalData;
    }
    
    const { error } = await supabase
      .from('settings')
      .update(updateData)
      .eq('id', id);
      
    if (error) throw error;
  },

  // Delete item
  async deleteItem(id) {
    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  },

  // Move stage up/down
  async moveStage(stageId, direction) {
    const { data: allStages } = await supabase
      .from('settings')
      .select('id, sort_order')
      .eq('type', 'stages')
      .eq('is_active', true)
      .order('sort_order');

    const currentIndex = allStages.findIndex(stage => stage.id === stageId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < allStages.length) {
      const currentStage = allStages[currentIndex];
      const swapStage = allStages[newIndex];

      await supabase.from('settings').update({ sort_order: swapStage.sort_order }).eq('id', currentStage.id);
      await supabase.from('settings').update({ sort_order: currentStage.sort_order }).eq('id', swapStage.id);
    }
  },

  // Update school settings
  async updateSchoolSettings(schoolData) {
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('type', 'school')
      .eq('name', 'profile')
      .limit(1);
    
    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from('settings')
        .update({ value: schoolData })
        .eq('id', existing[0].id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('settings')
        .insert([{
          type: 'school',
          name: 'profile',
          value: schoolData
        }]);
      if (error) throw error;
    }
  },

  // Get max sort order
  async getMaxSortOrder(type) {
    const { data } = await supabase
      .from('settings')
      .select('sort_order')
      .eq('type', type)
      .order('sort_order', { ascending: false })
      .limit(1);
      
    return data?.[0]?.sort_order || 0;
  }
};