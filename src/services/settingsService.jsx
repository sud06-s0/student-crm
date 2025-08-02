import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabaseAdmin'; // Import admin client

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
        const itemData = {
          id: item.id,
          name: item.name,
          field_key: item.field_key,
          stage_key: item.stage_key,
          is_active: item.is_active, 
          sort_order: item.sort_order,
          ...(item.value || {})
        };
        
        // For counsellors, extract user_id from value field for compatibility
        if (item.type === 'counsellors' && item.value && item.value.user_id) {
          itemData.user_id = item.value.user_id;
        }
        
        grouped[item.type].push(itemData);
      } else {
        console.warn(`Unexpected item type: ${item.type}`, item);
      }
    });
    
    return grouped;
  },

  // ← UPDATED: Create counsellor with user account (removed phone and profile image)
  async createCounsellorWithUser(counsellorData) {
    const { name, email, password } = counsellorData;
    
    try {
      // Step 1: Create user in Supabase Auth using ADMIN CLIENT
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create auth user');
      }

      // Step 2: Create user in custom users table using REGULAR CLIENT
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          auth_id: authData.user.id,
          email: email,
          full_name: name,
          role: 'user',
          is_active: true
        }])
        .select()
        .single();

      if (userError) {
        // Cleanup: Delete auth user if custom user creation failed
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw userError;
      }

      // Step 3: Create counsellor in settings table - Store user data in value field
      const maxOrder = await this.getMaxSortOrder('counsellors');
      
      const { data: counsellorData, error: counsellorError } = await supabase
        .from('settings')
        .insert([{
          type: 'counsellors',
          name: name,
          value: {
            user_id: userData.id,
            email: email
          },
          sort_order: maxOrder + 1,
          is_active: true
        }])
        .select()
        .single();

      if (counsellorError) {
        // Cleanup: Delete user and auth if counsellor creation failed
        await supabase.from('users').delete().eq('id', userData.id);
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw counsellorError;
      }

      return {
        counsellor: counsellorData,
        user: userData,
        auth: authData.user
      };

    } catch (error) {
      console.error('Error creating counsellor with user:', error);
      throw error;
    }
  },

  // ← UPDATED: Update counsellor and linked user (removed phone and profile image) + update leads
  async updateCounsellorWithUser(counsellorId, updateData) {
    const { name, email, password } = updateData;
    
    try {
      // Step 1: Get current counsellor data
      const { data: counsellor, error: counsellorError } = await supabase
        .from('settings')
        .select('*')
        .eq('id', counsellorId)
        .single();

      if (counsellorError) throw counsellorError;

      if (!counsellor.value || !counsellor.value.user_id) {
        throw new Error('Counsellor is not linked to a user account');
      }

      const userId = counsellor.value.user_id;
      const oldCounsellorName = counsellor.name; // ← NEW: Store old name for leads update

      // Step 2: Get user data
      const { data: user, error: userFetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userFetchError) throw userFetchError;

      // Step 3: Update user in custom users table using REGULAR CLIENT
      const userUpdates = {
        full_name: name,
        email: email
      };

      const { error: userUpdateError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', user.id);

      if (userUpdateError) throw userUpdateError;

      // Step 4: Update auth user email if changed using ADMIN CLIENT
      if (email !== user.email) {
        const { error: authEmailError } = await supabaseAdmin.auth.admin.updateUserById(
          user.auth_id,
          { email: email }
        );
        
        if (authEmailError) throw authEmailError;
      }

      // Step 5: Update password if provided using ADMIN CLIENT
      if (password && password.trim() !== '') {
        const { error: authPasswordError } = await supabaseAdmin.auth.admin.updateUserById(
          user.auth_id,
          { password: password }
        );
        
        if (authPasswordError) throw authPasswordError;
      }

      // Step 6: Update counsellor in settings table - Update value field
      const { error: counsellorUpdateError } = await supabase
        .from('settings')
        .update({ 
          name: name,
          value: {
            ...counsellor.value,
            email: email
          }
        })
        .eq('id', counsellorId);

      if (counsellorUpdateError) throw counsellorUpdateError;

      // ← NEW: Step 7: Update all leads with old counsellor name to new counsellor name
      if (oldCounsellorName !== name) {
        console.log(`Updating leads from counsellor "${oldCounsellorName}" to "${name}"`);
        const { error: leadsUpdateError } = await supabase
          .from('Leads')
          .update({ counsellor: name })
          .eq('counsellor', oldCounsellorName);

        if (leadsUpdateError) {
          console.error('Error updating leads with new counsellor name:', leadsUpdateError);
          throw leadsUpdateError;
        }

        console.log(`Successfully updated leads from "${oldCounsellorName}" to "${name}"`);
      }

      return { success: true };

    } catch (error) {
      console.error('Error updating counsellor with user:', error);
      throw error;
    }
  },

  // ← UPDATED: Delete counsellor and linked user + update leads to "Not Assigned"
  async deleteCounsellorWithUser(counsellorId) {
    try {
      // Step 1: Get counsellor data
      const { data: counsellor, error: counsellorError } = await supabase
        .from('settings')
        .select('*')
        .eq('id', counsellorId)
        .single();

      if (counsellorError) throw counsellorError;

      const counsellorName = counsellor.name;

      // Step 2: Update all leads with this counsellor to "Not Assigned"
      console.log(`Updating leads with counsellor "${counsellorName}" to "Not Assigned"`);
      const { error: leadsUpdateError } = await supabase
        .from('Leads')
        .update({ counsellor: 'Not Assigned' })
        .eq('counsellor', counsellorName);

      if (leadsUpdateError) {
        console.error('Error updating leads:', leadsUpdateError);
        throw leadsUpdateError;
      }

      if (!counsellor.value || !counsellor.value.user_id) {
        // If no linked user, just delete counsellor
        return await this.deleteItem(counsellorId);
      }

      const userId = counsellor.value.user_id;

      // Step 3: Get user data
      const { data: user, error: userFetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userFetchError) {
        console.warn('User not found, proceeding with counsellor deletion');
        return await this.deleteItem(counsellorId);
      }

      // Step 4: Delete from settings table using REGULAR CLIENT
      const { error: settingsDeleteError } = await supabase
        .from('settings')
        .delete()
        .eq('id', counsellorId);

      if (settingsDeleteError) throw settingsDeleteError;

      // Step 5: Delete from users table using REGULAR CLIENT
      const { error: userDeleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (userDeleteError) throw userDeleteError;

      // Step 6: Delete from Supabase Auth using ADMIN CLIENT
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.auth_id);
      
      if (authDeleteError) {
        console.warn('Failed to delete auth user:', authDeleteError);
      }

      console.log(`Successfully updated ${counsellorName}'s leads to "Not Assigned" and deleted counsellor`);
      return { success: true };

    } catch (error) {
      console.error('Error deleting counsellor with user:', error);
      throw error;
    }
  },

  // Get counsellor with user details
  async getCounsellorWithUser(counsellorId) {
    const { data: counsellor, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', counsellorId)
      .eq('type', 'counsellors')
      .single();

    if (error) throw error;

    // Get user details from users table using user_id stored in value
    if (counsellor.value && counsellor.value.user_id) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, role, is_active')
        .eq('id', counsellor.value.user_id)
        .single();

      if (!userError && user) {
        counsellor.users = user;
        counsellor.user_id = user.id; // For compatibility with existing code
      }
    }

    return counsellor;
  },

  // ← Custom Fields Operations
  async getCustomFieldsForLead(leadId) {
    try {
      const { data, error } = await supabase
        .from('lead_custom_fields')
        .select('*')
        .eq('lead_id', leadId);
        
      if (error) throw error;
      
      // Convert to key-value object for easier use
      const customFieldsMap = {};
      data?.forEach(field => {
        customFieldsMap[field.field_key] = field.field_value;
      });
      
      return customFieldsMap;
    } catch (error) {
      console.error('Error fetching custom fields for lead:', error);
      throw error;
    }
  },

  // Save/Update custom fields for a lead
  async saveCustomFieldsForLead(leadId, customFieldsData) {
    try {
      console.log('Saving custom fields for lead:', leadId, customFieldsData);
      
      // Get existing custom fields for this lead
      const { data: existingFields, error: fetchError } = await supabase
        .from('lead_custom_fields')
        .select('field_key')
        .eq('lead_id', leadId);

      if (fetchError) throw fetchError;

      const existingFieldKeys = existingFields?.map(f => f.field_key) || [];
      const newFieldKeys = Object.keys(customFieldsData);

      // Prepare upsert operations
      const upsertPromises = [];
      
      for (const [fieldKey, fieldValue] of Object.entries(customFieldsData)) {
        if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
          upsertPromises.push(
            supabase
              .from('lead_custom_fields')
              .upsert({
                lead_id: leadId,
                field_key: fieldKey,
                field_value: fieldValue,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'lead_id,field_key'
              })
          );
        }
      }

      // Delete fields that are no longer present or are empty
      const fieldsToDelete = existingFieldKeys.filter(key => 
        !newFieldKeys.includes(key) || 
        !customFieldsData[key] || 
        customFieldsData[key] === ''
      );

      if (fieldsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('lead_custom_fields')
          .delete()
          .eq('lead_id', leadId)
          .in('field_key', fieldsToDelete);

        if (deleteError) throw deleteError;
      }

      // Execute all upsert operations
      if (upsertPromises.length > 0) {
        const results = await Promise.all(upsertPromises);
        
        // Check for errors in any of the operations
        for (const result of results) {
          if (result.error) throw result.error;
        }
      }

      console.log('Custom fields saved successfully');
      return { success: true };

    } catch (error) {
      console.error('Error saving custom fields:', error);
      
      // Check if it's the max fields limit error
      if (error.message && error.message.includes('Maximum 5 custom fields allowed')) {
        throw new Error('Maximum 5 custom fields allowed per lead');
      }
      
      throw error;
    }
  },

  // Get active custom field definitions from settings
  async getActiveCustomFieldDefinitions() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('type', 'form_fields')
        .eq('is_active', true);
        
      if (error) throw error;

      // Filter only custom fields
      const customFields = data?.filter(field => {
        return this.isCustomFieldByKey(field.field_key) || 
               this.isCustomField(field.name);
      }) || [];

      return customFields;
    } catch (error) {
      console.error('Error fetching custom field definitions:', error);
      throw error;
    }
  },

  // Delete all custom fields for a lead (when lead is deleted)
  async deleteAllCustomFieldsForLead(leadId) {
    try {
      const { error } = await supabase
        .from('lead_custom_fields')
        .delete()
        .eq('lead_id', leadId);
        
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting custom fields for lead:', error);
      throw error;
    }
  },

  // Get custom fields count for a specific lead
  async getCustomFieldsCountForLead(leadId) {
    try {
      const { data, error } = await supabase
        .from('lead_custom_fields')
        .select('id')
        .eq('lead_id', leadId);
        
      if (error) throw error;
      
      return data?.length || 0;
    } catch (error) {
      console.error('Error counting custom fields for lead:', error);
      throw error;
    }
  },

  // Fix existing custom fields without field_key
  async fixCustomFieldKeys() {
    try {
      const { data: customFields, error } = await supabase
        .from('settings')
        .select('*')
        .eq('type', 'form_fields')
        .eq('is_custom', true);
        
      if (error) throw error;
      
      const fixPromises = customFields
        .filter(field => !field.field_key) // Only fix fields without field_key
        .map(field => {
          const fieldKey = 'custom_field_' + field.id;
          
          return supabase
            .from('settings')
            .update({ 
              field_key: fieldKey,
              value: { 
                ...(field.value || {}),
                field_key: fieldKey 
              }
            })
            .eq('id', field.id);
        });
        
      if (fixPromises.length > 0) {
        await Promise.all(fixPromises);
        console.log(`Fixed ${fixPromises.length} custom fields with missing field_key`);
      }
      
      return { success: true, fixedCount: fixPromises.length };
    } catch (error) {
      console.error('Error fixing custom field keys:', error);
      throw error;
    }
  },

  // Stage helper functions
  getStageByKey(stages, stageKey) {
    return stages.find(stage => stage.stage_key === stageKey);
  },

  getStageByName(stages, stageName) {
    return stages.find(stage => stage.name === stageName);
  },

  createStageNameToKeyMapping(stages) {
    const mapping = {};
    stages.forEach(stage => {
      if (stage.stage_key) {
        mapping[stage.name] = stage.stage_key;
      }
    });
    return mapping;
  },

  createStageKeyToDataMapping(stages) {
    const mapping = {};
    stages.forEach(stage => {
      if (stage.stage_key) {
        mapping[stage.stage_key] = stage;
      }
    });
    return mapping;
  },

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

  // ← UPDATED: Field validation functions (added secondPhone)
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
      'Visit Time', 'Visit Location', 'Registration Fees', 'Enrolled',
      'Second Phone' // ← NEW: Added Second Phone as a constant field
    ];
    return exactConstantFields.includes(fieldName);
  },

  isConstantFieldByKey(fieldKey) {
    const constantKeys = [
      'location', 'occupation', 'currentSchool', 'offer', 'notes',
      'meetingDate', 'meetingTime', 'meetingLink', 'visitDate',
      'visitTime', 'visitLocation', 'registrationFees', 'enrolled',
      'secondPhone' // ← NEW: Added secondPhone as a constant field key
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

  // CRUD operations
  async createItem(type, name, additionalData = {}) {
    const maxOrder = await this.getMaxSortOrder(type);
    
    const insertData = {
      type,
      name,
      value: Object.keys(additionalData).length > 0 ? additionalData : null,
      sort_order: maxOrder + 1,
      is_active: true
    };

    // Add field_key for custom form fields
    if (type === 'form_fields' && additionalData.is_custom) {
      insertData.field_key = additionalData.field_key || null;
    }

    const { data, error } = await supabase
      .from('settings')
      .insert([insertData])
      .select();
      
    if (error) throw error;
    return data[0];
  },

  // Modify updateItem to preserve field_key for custom fields
  async updateItem(id, name, additionalData = {}) {
    try {
      // Get current item to preserve field_key
      const { data: currentItem, error: fetchError } = await supabase
        .from('settings')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      const updateData = { name };
      
      // Preserve existing field_key for form fields
      if (currentItem.type === 'form_fields' && currentItem.field_key) {
        additionalData.field_key = currentItem.field_key;
      }
      
      if (Object.keys(additionalData).length > 0) {
        updateData.value = additionalData;
      }
      
      const { error } = await supabase
        .from('settings')
        .update(updateData)
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  },

  async deleteItem(id) {
    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  },

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