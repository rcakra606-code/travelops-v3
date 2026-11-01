import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const SettingsContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
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
  smtpSenderName: 'TravelOps System',
  notificationEmail: ''
};

const fetchDbSettings = async () => {
  const { data, error } = await supabase
    .from('travelops_settings')
    .select('*')
    .eq('setting_key', 'global_preferences')
    .maybeSingle();

  if (error) {
    console.warn('Could not load settings from database:', error.message);
    return null;
  }
  return data?.setting_value || null;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const reloadSettings = useCallback(async () => {
    try {
      const val = await fetchDbSettings();
      if (val) setSettings({ ...DEFAULT_SETTINGS, ...val });
    } catch (err) {
      console.error('Failed to reload settings:', err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchDbSettings()
      .then((val) => {
        if (!cancelled && val) {
          setSettings({ ...DEFAULT_SETTINGS, ...val });
        }
      })
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      return { success: true };
    } catch (err) {
      console.error('Failed to save settings:', err);
      throw err;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, reloadSettings, loading }}>
      {!loading && children}
    </SettingsContext.Provider>
  );
};
