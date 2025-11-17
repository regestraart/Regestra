
import React, { createContext, useState, useContext, PropsWithChildren } from 'react';
import { users, User } from '../data/mock';

type Role = 'artist' | 'artLover';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  switchUserRole: (role: Role) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// FIX: Changed type definition for props to PropsWithChildren to resolve compilation error.
export const UserProvider = ({ children }: PropsWithChildren) => {
  // Default to the artist user being logged in for demonstration purposes.
  // In a real app, this would be null initially and set after login.
  const [currentUser, setCurrentUser] = useState<User | null>(users.artist);

  const switchUserRole = (role: Role) => {
    const userToSwitchTo = role === 'artist' ? users.artist : users.artLover;
    setCurrentUser(userToSwitchTo);
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, switchUserRole }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};