import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    idleTimeout: 15,
    companyName: 'TravelOps Inc.',
    currency: 'IDR',
    dateFormat: 'YYYY-MM-DD',
    language: 'en'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('travelops_settings')
        .select('*')
        .eq('setting_key', 'global_preferences')
        .maybeSingle();

      if (data && data.setting_value) {
        setSettings(data.setting_value);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const { error } = await supabase
        .from('travelops_settings')
        .upsert({ 
          setting_key: 'global_preferences', 
          setting_value: newSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setSettings(newSettings);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {!loading && children}
    </SettingsContext.Provider>
  );
};
