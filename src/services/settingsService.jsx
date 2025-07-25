import { supabase } from '../lib/supabase';

export const settingsService = {
  // Get all settings
  async getAllSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
      
    if (error) throw error;
    
    // Group by type
    const grouped = {
      stages: [],
      grades: [],
      counsellors: [],
      sources: [],
      school: {}
    };
    
    data?.forEach(item => {
      if (item.type === 'school') {
        grouped.school = item.value || {};
      } else {
        grouped[item.type]?.push({
          id: item.id,
          name: item.name,
          ...(item.value || {}),
          sort_order: item.sort_order
        });
      }
    });
    
    return grouped;
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
        sort_order: maxOrder + 1
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

  // Delete item
  async deleteItem(id) {
    const { error } = await supabase
      .from('settings')
      .update({ is_active: false })
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