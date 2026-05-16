export const logSystemAction = (user, action, details = '') => {
  try {
    const logsKey = 'travelops_logs';
    const existingLogs = localStorage.getItem(logsKey);
    const logs = existingLogs ? JSON.parse(existingLogs) : [];
    
    const newLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      user: user?.name || 'System',
      role: user?.role || 'System',
      action,
      details
    };

    // Keep only the last 1000 logs to prevent memory overflow
    const updatedLogs = [newLog, ...logs].slice(0, 1000);
    
    localStorage.setItem(logsKey, JSON.stringify(updatedLogs));
    
    // Also output to console for debugging
    console.log(`[TravelOps Audit] ${newLog.user} | ${action} | ${details}`);
  } catch (error) {
    console.error('Failed to write system log:', error);
  }
};
