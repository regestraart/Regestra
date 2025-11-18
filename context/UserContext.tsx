
import React, { createContext, useState, useContext, PropsWithChildren } from 'react';
import { users, User } from '../data/mock';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: PropsWithChildren) => {
  // Default to the artist user being logged in for demonstration purposes.
  // In a real app, this would be null initially and set after login.
  const [currentUser, setCurrentUser] = useState<User | null>(users.artist);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
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
