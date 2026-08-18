import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

const DEFAULT_SETTINGS = {
  idleTimeout: 15,
  enableReminders: true,
  companyName: 'TravelOps Inc.',
  currency: 'IDR',
  dateFormat: 'YYYY-MM-DD',
  language: 'en',
  passwordMinLength: 8,
  passwordRequireNumbers: true,
  passwordRequireSymbols: true,
  lockoutThreshold: 5,
  logRetentionDays: 30,
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  smtpSenderName: 'TravelOps System'
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
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
        setSettings({ ...DEFAULT_SETTINGS, ...data.setting_value });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const merged = { ...settings, ...newSettings };
      const { error } = await supabase
        .from('travelops_settings')
        .upsert({ 
          setting_key: 'global_preferences', 
          setting_value: merged,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setSettings(merged);
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
