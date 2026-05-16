import React, { createContext, useState, useEffect, useContext } from 'react';

export const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  idleTimeout: 15, // in minutes
  smtpHost: 'smtp.gmail.com',
  smtpPort: '587',
  smtpUser: 'admin@travelops.com',
  smtpPassword: '',
  enableReminders: true
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('travelops_settings');
    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error("Failed to parse settings");
      }
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('travelops_settings', JSON.stringify(updated));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {isLoaded && children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
