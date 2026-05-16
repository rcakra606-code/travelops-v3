import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('travelops_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const savedUsers = localStorage.getItem('travelops_users');
        const users = savedUsers ? JSON.parse(savedUsers) : [];
        
        const foundUser = users.find(u => u.email === email);

        if (!foundUser) {
          reject(new Error('Invalid email or password'));
          return;
        }

        if (foundUser.password && foundUser.password !== password) {
          reject(new Error('Invalid email or password'));
          return;
        }

        if (!foundUser.password && email === 'admin@travelops.com' && password !== 'password') {
           reject(new Error('Invalid email or password'));
           return;
        }

        if (foundUser.isLocked) {
          reject(new Error('Your account has been locked. Please contact admin.'));
          return;
        }

        if (foundUser.status === 'Inactive') {
          reject(new Error('Your account is inactive.'));
          return;
        }

        // Generate a unique session token for this device login
        const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        
        // Update last login and session token
        const updatedUser = { 
          ...foundUser, 
          lastLogin: new Date().toISOString(),
          sessionToken: sessionToken
        };
        
        // Save back to users list
        const updatedUsers = users.map(u => u.id === foundUser.id ? updatedUser : u);
        localStorage.setItem('travelops_users', JSON.stringify(updatedUsers));

        setUser(updatedUser);
        localStorage.setItem('travelops_user', JSON.stringify(updatedUser));
        localStorage.setItem('travelops_session', sessionToken);
        resolve(updatedUser);
      }, 800);
    });
  };

  const logout = (reason = null) => {
    setIsLoggingOut(true);
    setTimeout(() => {
      setUser(null);
      localStorage.removeItem('travelops_user');
      localStorage.removeItem('travelops_session');
      setIsLoggingOut(false);
      if (reason) {
        alert(`Logged out: ${reason}`);
      }
    }, 1500); // 1.5 second delay for sweet goodbye message
  };

  const verifySession = () => {
    if (!user) return true;
    const localSession = localStorage.getItem('travelops_session');
    const savedUsers = localStorage.getItem('travelops_users');
    if (savedUsers) {
      const users = JSON.parse(savedUsers);
      const dbUser = users.find(u => u.id === user.id);
      if (dbUser && dbUser.sessionToken !== localSession) {
        logout('You have been logged out because your account was accessed from another device.');
        return false;
      }
    }
    return true;
  };

  const forceLogoutAll = () => {
    const savedUsers = localStorage.getItem('travelops_users');
    if (savedUsers) {
      const users = JSON.parse(savedUsers);
      const updatedUsers = users.map(u => ({ ...u, sessionToken: null }));
      localStorage.setItem('travelops_users', JSON.stringify(updatedUsers));
      // Log the action? Maybe from the UI side.
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, verifySession, forceLogoutAll, loading }}>
      {!loading && children}
      {isLoggingOut && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: '#0f172a', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', zIndex: 99999,
          color: '#f8fafc', animation: 'fadeIn 0.3s ease-out'
        }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#3b82f6' }}>
            Goodbye, {user?.name || 'TravelOps User'}!
          </h2>
          <p style={{ color: '#94a3b8' }}>Logging you out securely...</p>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
