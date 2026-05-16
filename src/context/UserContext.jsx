import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUsers = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('travelops_users');
    if (saved) {
      setUsers(JSON.parse(saved));
    } else {
      // Default dummy data
        const defaultUsers = [
          { id: '1', name: 'Admin TravelOps', email: 'admin@travelops.com', role: 'Admin', status: 'Active', password: 'password', isLocked: false, lastLogin: null },
          { id: '2', name: 'John Manager', email: 'john@travelops.com', role: 'Manager', status: 'Active', password: 'password123', isLocked: false, lastLogin: null },
          { id: '3', name: 'Sarah Staff', email: 'sarah@travelops.com', role: 'Staff', status: 'Active', password: 'password123', isLocked: false, lastLogin: null }
        ];
      setUsers(defaultUsers);
      localStorage.setItem('travelops_users', JSON.stringify(defaultUsers));
    }
  }, []);

  const saveUsers = (newUsers) => {
    setUsers(newUsers);
    localStorage.setItem('travelops_users', JSON.stringify(newUsers));
  };

  const addUser = (user) => {
    const newUser = { ...user, id: Date.now().toString() };
    saveUsers([...users, newUser]);
  };

  const updateUser = (id, updatedUser) => {
    saveUsers(users.map(u => u.id === id ? { ...u, ...updatedUser } : u));
  };

  const deleteUser = (id) => {
    saveUsers(users.filter(u => u.id !== id));
  };

  return (
    <UserContext.Provider value={{ users, addUser, updateUser, deleteUser }}>
      {children}
    </UserContext.Provider>
  );
};
