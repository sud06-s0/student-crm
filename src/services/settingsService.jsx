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

  // Upload profile image to Supabase Storage
  async uploadProfileImage(file, userId) {
    try {
      if (!file) return null;
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Create counsellor with user account - USES ADMIN CLIENT
  async createCounsellorWithUser(counsellorData) {
    const { name, email, password, phone, profileImageFile } = counsellorData;
    
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

      // Step 2: Upload profile image if provided
      let profileImageUrl = null;
      if (profileImageFile) {
        profileImageUrl = await this.uploadProfileImage(profileImageFile, authData.user.id);
      }

      // Step 3: Create user in custom users table using REGULAR CLIENT
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          auth_id: authData.user.id,
          email: email,
          full_name: name,
          phone: phone || null,
          profile_image_url: profileImageUrl,
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

      // Step 4: Create counsellor in settings table - Store user data in value field
      const maxOrder = await this.getMaxSortOrder('counsellors');
      
      const { data: counsellorData, error: counsellorError } = await supabase
        .from('settings')
        .insert([{
          type: 'counsellors',
          name: name,
          value: {
            user_id: userData.id,
            email: email,
            phone: phone || null,
            profile_image_url: profileImageUrl
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

  // Update counsellor and linked user - USES ADMIN CLIENT for auth updates
  async updateCounsellorWithUser(counsellorId, updateData) {
    const { name, email, password, phone, profileImageFile } = updateData;
    
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

      // Step 2: Get user data
      const { data: user, error: userFetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userFetchError) throw userFetchError;

      // Step 3: Upload new profile image if provided
      let profileImageUrl = user.profile_image_url;
      if (profileImageFile) {
        profileImageUrl = await this.uploadProfileImage(profileImageFile, user.auth_id);
      }

      // Step 4: Update user in custom users table using REGULAR CLIENT
      const userUpdates = {
        full_name: name,
        email: email,
        phone: phone || null,
        profile_image_url: profileImageUrl
      };

      const { error: userUpdateError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', user.id);

      if (userUpdateError) throw userUpdateError;

      // Step 5: Update auth user email if changed using ADMIN CLIENT
      if (email !== user.email) {
        const { error: authEmailError } = await supabaseAdmin.auth.admin.updateUserById(
          user.auth_id,
          { email: email }
        );
        
        if (authEmailError) throw authEmailError;
      }

      // Step 6: Update password if provided using ADMIN CLIENT
      if (password && password.trim() !== '') {
        const { error: authPasswordError } = await supabaseAdmin.auth.admin.updateUserById(
          user.auth_id,
          { password: password }
        );
        
        if (authPasswordError) throw authPasswordError;
      }

      // Step 7: Update counsellor in settings table - Update value field
      const { error: counsellorUpdateError } = await supabase
        .from('settings')
        .update({ 
          name: name,
          value: {
            ...counsellor.value,
            email: email,
            phone: phone || null,
            profile_image_url: profileImageUrl
          }
        })
        .eq('id', counsellorId);

      if (counsellorUpdateError) throw counsellorUpdateError;

      return { success: true };

    } catch (error) {
      console.error('Error updating counsellor with user:', error);
      throw error;
    }
  },

  // Delete counsellor and linked user - USES ADMIN CLIENT for auth deletion
  async deleteCounsellorWithUser(counsellorId) {
    try {
      // Step 1: Get counsellor data
      const { data: counsellor, error: counsellorError } = await supabase
        .from('settings')
        .select('*')
        .eq('id', counsellorId)
        .single();

      if (counsellorError) throw counsellorError;

      if (!counsellor.value || !counsellor.value.user_id) {
        // If no linked user, just delete counsellor
        return await this.deleteItem(counsellorId);
      }

      const userId = counsellor.value.user_id;

      // Step 2: Get user data
      const { data: user, error: userFetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userFetchError) {
        console.warn('User not found, proceeding with counsellor deletion');
        return await this.deleteItem(counsellorId);
      }

      // Step 3: Delete profile image from storage if exists
      if (user.profile_image_url) {
        try {
          const url = new URL(user.profile_image_url);
          const filePath = url.pathname.split('/').pop();
          
          await supabase.storage
            .from('avatars')
            .remove([filePath]);
        } catch (imageError) {
          console.warn('Failed to delete profile image:', imageError);
        }
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
        .select('id, email, full_name, phone, profile_image_url, role, is_active')
        .eq('id', counsellor.value.user_id)
        .single();

      if (!userError && user) {
        counsellor.users = user;
        counsellor.user_id = user.id; // For compatibility with existing code
      }
    }

    return counsellor;
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

  // Field validation functions
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

    const { data, error } = await supabase
      .from('settings')
      .insert([insertData])
      .select();
      
    if (error) throw error;
    return data[0];
  },

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