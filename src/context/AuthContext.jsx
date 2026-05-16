import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { logSystemAction } from '../utils/logger';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    try {
      const sessionToken = localStorage.getItem('travelops_session');
      const userId = localStorage.getItem('travelops_user_id');
      
      if (sessionToken && userId) {
        const { data, error } = await supabase
          .from('travelops_users')
          .select('*')
          .eq('id', userId)
          .single();

        if (data && !data.is_locked) {
          // Normalize user object for the frontend
          setUser({
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            status: data.status,
            mustChangePassword: data.must_change_password
          });
        } else {
          // User is locked or deleted from DB
          logout('Account locked or session invalid');
        }
      }
    } catch (err) {
      console.error("Session check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Fetch user by email only first
      const { data, error } = await supabase
        .from('travelops_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        return { success: false, message: 'Invalid credentials or user not found' };
      }

      if (data.status !== 'Active') {
        return { success: false, message: 'Your account is inactive. Contact administrator.' };
      }

      if (data.is_locked) {
        return { success: false, message: 'Account is locked! Please contact your administrator.' };
      }

      // Check password
      if (data.password_hash !== password) {
        // Track failed attempts
        const attemptsKey = `login_attempts_${email}`;
        const currentAttempts = parseInt(localStorage.getItem(attemptsKey) || '0', 10) + 1;
        
        if (currentAttempts >= 3) {
          // Lock the account in database
          await supabase
            .from('travelops_users')
            .update({ is_locked: true })
            .eq('id', data.id);
            
          localStorage.removeItem(attemptsKey);
          return { success: false, message: 'Account locked due to 3 failed password attempts!' };
        } else {
          localStorage.setItem(attemptsKey, currentAttempts.toString());
          return { success: false, message: `Incorrect password! You have ${3 - currentAttempts} attempts left.` };
        }
      }

      // If password matches, clear attempts
      localStorage.removeItem(`login_attempts_${email}`);

      // Generate a simple session token (in production, use JWT or Supabase Auth)
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Update last login
      await supabase
        .from('travelops_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      localStorage.setItem('travelops_user_id', data.id);
      localStorage.setItem('travelops_session', sessionToken);
      
      const loggedInUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        mustChangePassword: data.must_change_password
      };

      setUser(loggedInUser);
      logSystemAction(loggedInUser, 'Login', 'User successfully logged in via Supabase');
      
      return { success: true, user: loggedInUser };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Server error during login' };
    }
  };

  const logout = (reason = null) => {
    setIsLoggingOut(true);
    setTimeout(() => {
      setUser(null);
      localStorage.removeItem('travelops_user_id');
      localStorage.removeItem('travelops_session');
      setIsLoggingOut(false);
      if (reason) {
        alert(`Logged out: ${reason}`);
      }
    }, 1500);
  };

  const verifySession = async () => {
    const sessionToken = localStorage.getItem('travelops_session');
    if (!sessionToken || !user) {
      logout('Session missing locally');
      return false;
    }
    
    // Quick DB check to ensure they weren't locked out remotely
    const { data } = await supabase
      .from('travelops_users')
      .select('is_locked')
      .eq('id', user.id)
      .single();
      
    if (data?.is_locked) {
      logout('Account has been locked by Administrator');
      return false;
    }
    return true;
  };

  const forceLogoutAll = async () => {
    // To truly force logout others, you would normally invalidate sessions in the DB.
    // For now, since we rely on LocalStorage tokens, this is an advanced feature.
    alert("Force logout requires Supabase Realtime or JWT invalidation (Coming soon in V4.1)");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, verifySession, forceLogoutAll, loading, setUser }}>
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
