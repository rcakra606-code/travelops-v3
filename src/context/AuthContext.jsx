import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { logSystemAction } from '../utils/logger';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (session) => {
    if (session && session.user) {
      try {
        const { data, error } = await supabase
          .from('travelops_users')
          .select('*')
          .ilike('email', session.user.email)
          .single();

        if (data && !data.is_locked) {
          setUser({
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            status: data.status,
            mustChangePassword: data.must_change_password
          });
        } else {
          await supabase.auth.signOut();
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to load user profile", err);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const loginEmail = email.trim();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (authError) {
        return { success: false, message: authError.message };
      }

      // Fetch user by email to verify they are active in our system
      const { data, error } = await supabase
        .from('travelops_users')
        .select('*')
        .ilike('email', loginEmail)
        .single();

      if (error || !data) {
        await supabase.auth.signOut();
        return { success: false, message: 'User profile not found in system.' };
      }

      if (data.status !== 'Active') {
        await supabase.auth.signOut();
        return { success: false, message: 'Your account is inactive. Contact administrator.' };
      }

      if (data.is_locked) {
        await supabase.auth.signOut();
        return { success: false, message: 'Account is locked! Please contact your administrator.' };
      }

      // Update last login
      await supabase
        .from('travelops_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      const loggedInUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        mustChangePassword: data.must_change_password
      };

      setUser(loggedInUser);
      logSystemAction(loggedInUser, 'Login', 'User successfully logged in via Supabase Auth');
      
      return { success: true, user: loggedInUser };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Server error during login' };
    }
  };

  const logout = useCallback(async (reason = null) => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setTimeout(() => {
      setUser(null);
      setIsLoggingOut(false);
      if (reason) {
        alert(`Logged out: ${reason}`);
      }
    }, 1500);
  }, []);

  const verifySession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !user) {
      logout('Session expired or missing');
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
    alert("Force logout will be managed via Supabase Admin Dashboard in V4.1");
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
