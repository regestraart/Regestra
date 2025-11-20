
import React, { createContext, useState, useContext, PropsWithChildren, useEffect } from 'react';
import { User, findUserById } from '../data/mock';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: PropsWithChildren) => {
  const [currentUser, _setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem('currentUser');
      if (storedUserId) {
        const user = findUserById(storedUserId);
        _setCurrentUser(user || null);
      }
    } catch (error) {
      console.error("Failed to load user session from localStorage", error);
      _setCurrentUser(null);
      localStorage.removeItem('currentUser');
    }
    setIsLoading(false);
  }, []);

  const setCurrentUser = (user: User | null) => {
    _setCurrentUser(user);
    if (user) {
      localStorage.setItem('currentUser', user.id);
    } else {
      localStorage.removeItem('currentUser');
    }
  };
  
  if (isLoading) {
    return null; // Or a loading spinner for the whole app
  }

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
