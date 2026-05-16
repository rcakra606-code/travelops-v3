import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { logSystemAction } from '../utils/logger';
import { useAuth } from './AuthContext';

const UserContext = createContext();

export const useUsers = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('travelops_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mapped = data.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        isLocked: u.is_locked,
        mustChangePassword: u.must_change_password,
        lastLogin: u.last_login
      }));
      
      setUsers(mapped);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userObj) => {
    try {
      const { data, error } = await supabase
        .from('travelops_users')
        .insert([{
          name: userObj.name,
          email: userObj.email,
          role: userObj.role,
          status: userObj.status,
          password_hash: userObj.password,
          must_change_password: userObj.mustChangePassword ?? false
        }])
        .select()
        .single();

      if (error) throw error;
      logSystemAction(currentUser, 'Create User', `Created new user ${data.email}`);
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error('Error adding user:', err);
      return { success: false, error: err.message };
    }
  };

  const updateUser = async (id, updates) => {
    if (!id) {
      console.error("No ID provided to updateUser!");
      return { success: false, error: 'No ID provided' };
    }
    
    try {
      const dbUpdates = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.role) dbUpdates.role = updates.role;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.isLocked !== undefined) dbUpdates.is_locked = updates.isLocked;
      if (updates.password) dbUpdates.password_hash = updates.password;
      if (updates.mustChangePassword !== undefined) dbUpdates.must_change_password = updates.mustChangePassword;

      const { error } = await supabase
        .from('travelops_users')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      logSystemAction(currentUser, 'Update User', `Updated user ${id}`);
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error('Error updating user:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteUser = async (id) => {
    try {
      const { error } = await supabase
        .from('travelops_users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      logSystemAction(currentUser, 'Delete User', `Deleted user ${id}`);
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error('Error deleting user:', err);
      return { success: false, error: err.message };
    }
  };

  return (
    <UserContext.Provider value={{ users, addUser, updateUser, deleteUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
