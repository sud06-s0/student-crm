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
          is_active: item.is_active, 
          ...(item.value || {}),
          sort_order: item.sort_order
        });
      } else {
        // Handle unexpected types - you can log this for debugging
        console.warn(`Unexpected item type: ${item.type}`, item);
      }
    });
    
    return grouped;
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

  // Get count of custom form fields (only the 5 additional ones)
  async getCustomFormFieldsCount() {
    const { data, error } = await supabase
      .from('settings')
      .select('id, name, value')
      .eq('type', 'form_fields')
      .eq('is_active', true);
      
    if (error) throw error;
    
    // Filter for custom fields only (not the 17 constant ones)
    const customFields = data?.filter(field => 
      this.isCustomField(field.name)
    ) || [];
    
    return customFields.length;
  },

  // Check if field is super constant (no actions at all)
  isSuperConstantField(fieldName) {
    const superConstantFields = ['Parents Name', 'Kids Name', 'Phone', 'Email'];
    return superConstantFields.includes(fieldName);
  },

  // Check if field is constant (only name editing allowed)
  isConstantField(fieldName) {
    const constantFields = [
      'Location', 'Occupation', 'Current School', 'Offer', 'Notes',
      'Meeting Date', 'Meeting Time', 'Meeting Link', 'Visit Date',
      'Visit Time', 'Visit Location', 'Registration Fees', 'Enrolled'
    ];
    return constantFields.includes(fieldName);
  },

  // Check if field is custom (fully editable/deletable)
  isCustomField(fieldName) {
    return !this.isSuperConstantField(fieldName) && !this.isConstantField(fieldName);
  },

  // Check if field can be deleted (only custom fields)
  isFieldDeletable(fieldName) {
    return this.isCustomField(fieldName);
  },

  // Check if field name can be edited (constant + custom fields)
  isFieldNameEditable(fieldName) {
    return this.isConstantField(fieldName) || this.isCustomField(fieldName);
  },

  // Check if field status can be toggled (only custom fields)
  canToggleFieldStatus(fieldName) {
    return this.isCustomField(fieldName);
  },

  // Check if mandatory status can be changed (only custom fields)
  canChangeMandatoryStatus(fieldName) {
    return this.isSuperConstantField(fieldName);
  },

  // Check if dropdown options can be edited (only custom fields)
  canEditDropdownOptions(fieldName) {
    return this.isCustomField(fieldName);
  },

  // Create new item
  async createItem(type, name, additionalData = {}) {
    const maxOrder = await this.getMaxSortOrder(type);
    
    const { data, error } = await supabase
      .from('settings')
      .insert([{
        type,
        name,
        value: Object.keys(additionalData).length > 0 ? additionalData : null,
        sort_order: maxOrder + 1,
        is_active: true
      }])
      .select();
      
    if (error) throw error;
    return data[0];
  },

  // Update item
  async updateItem(id, name, additionalData = {}) {
    const updateData = {
      name
    };
    
    if (Object.keys(additionalData).length > 0) {
      updateData.value = additionalData;
    }
    
    const { error } = await supabase
      .from('settings')
      .update(updateData)
      .eq('id', id);
      
    if (error) throw error;
  },

  // Delete item (for custom fields only)
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

      // Swap sort orders
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