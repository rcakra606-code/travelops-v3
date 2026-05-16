import { supabase } from '../supabaseClient';

export const logSystemAction = async (user, action, details = '') => {
  try {
    const newLog = {
      user_name: user?.name || 'System',
      role: user?.role || 'System',
      action,
      details
    };

    const { error } = await supabase
      .from('travelops_logs')
      .insert([newLog]);

    if (error) {
      console.error('Failed to write system log to Supabase:', error);
    }
    
    // Also output to console for debugging
    console.log(`[TravelOps Audit] ${newLog.user_name} | ${action} | ${details}`);
  } catch (error) {
    console.error('Failed to write system log:', error);
  }
};
