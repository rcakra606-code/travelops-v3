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
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userObj.name,
          email: userObj.email,
          role: userObj.role,
          status: userObj.status,
          password: userObj.password,
          mustChangePassword: userObj.mustChangePassword ?? false
        })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      logSystemAction(currentUser, 'Create User', `Created new user ${userObj.email}`);
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
      // If updating password, use the secure backend API
      if (updates.password) {
        const response = await fetch(`/api/admin/users/${id}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword: updates.password })
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        logSystemAction(currentUser, 'Update User', `Reset password for user ${id}`);
      }

      // Update travelops_users directly for other fields
      const dbUpdates = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.isLocked !== undefined) dbUpdates.is_locked = updates.isLocked;
      if (updates.mustChangePassword !== undefined) dbUpdates.must_change_password = updates.mustChangePassword;

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from('travelops_users')
          .update(dbUpdates)
          .eq('id', id);

        if (error) throw error;
        logSystemAction(currentUser, 'Update User', `Updated user ${id}`);
      }

      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error('Error updating user:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteUser = async (id) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      // If the backend says 'User not found', it means it's missing from Auth.
      // We still want to proceed and delete the orphaned record from the database.
      if (!data.success && !data.error?.includes('User not found')) {
        throw new Error(data.error);
      }

      // Delete from travelops_users explicitly just in case FK cascade is missing
      await supabase.from('travelops_users').delete().eq('id', id);

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
