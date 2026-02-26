import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { seedUsers } from '../data/seedData';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tpms_current_user');
    if (saved) {
      return JSON.parse(saved);
    }
    // For demo/static deployments, auto-authenticate the first seeded user
    const users: User[] = JSON.parse(localStorage.getItem('tpms_users') || JSON.stringify(seedUsers));
    const defaultUser = users.find(u => u.isActive) || users[0] || null;
    if (defaultUser) {
      localStorage.setItem('tpms_current_user', JSON.stringify(defaultUser));
    }
    return defaultUser;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('tpms_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('tpms_current_user');
    }
  }, [currentUser]);

  const login = (email: string, password: string): boolean => {
    const users: User[] = JSON.parse(localStorage.getItem('tpms_users') || JSON.stringify(seedUsers));
    const user = users.find(u => u.email === email && u.password === password && u.isActive);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      isAuthenticated: !!currentUser,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
