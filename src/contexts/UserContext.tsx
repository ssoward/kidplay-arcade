import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// User account types and interfaces
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  soundEnabled: boolean;
  difficulty: 'adaptive' | 'easy' | 'medium' | 'hard';
  aiInteraction: boolean;
  notificationsEnabled: boolean;
  language: string;
}

export interface GameStatistics {
  gamesPlayed: number;
  totalScore: number;
  averageScore: number;
  favoriteGames: string[];
  achievements: string[];
  streaks: {
    current: number;
    longest: number;
  };
  skillLevels: Record<string, number>; // Game-specific skill levels
}

export interface ParentalSettings {
  timeLimit: number; // minutes per day
  allowedGames: string[];
  restrictedContent: string[];
  sessionReminders: boolean;
  reportingEnabled: boolean;
}

export interface PrivacySettings {
  dataCollection: boolean;
  analytics: boolean;
  personalization: boolean;
  shareProgress: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  dateOfBirth?: Date;
  avatar?: string;
  preferences: UserPreferences;
  gameStats: GameStatistics;
  parentalControls?: ParentalSettings;
  privacySettings: PrivacySettings;
  createdAt: Date;
  lastActive: Date;
  accountType: 'child' | 'parent' | 'educator' | 'guest';
  isVerified: boolean;
  parentEmail?: string; // For child accounts
}

// Helper function to convert date strings to Date objects from backend response
const parseUserDates = (userData: any): User => {
  return {
    ...userData,
    dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : undefined,
    createdAt: new Date(userData.createdAt),
    lastActive: new Date(userData.lastActive)
  };
};

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuest: boolean;
}

interface UserContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<boolean>;
  switchToGuest: () => void;
  refreshUser: () => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  dateOfBirth?: Date;
  accountType: 'child' | 'parent' | 'educator';
  parentEmail?: string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isGuest: false
  });

  const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

  // Initialize user session on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('user_token');
      const guestMode = localStorage.getItem('guest_mode');
      
      if (guestMode === 'true') {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isGuest: true
        });
        return;
      }
      
      if (token) {
        // Validate token with backend
        const response = await fetch(`${baseUrl}/api/user/validate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setAuthState({
            user: parseUserDates(userData.user),
            isAuthenticated: true,
            isLoading: false,
            isGuest: false
          });
        } else {
          // Token invalid, clear it
          localStorage.removeItem('user_token');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isGuest: false
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isGuest: false
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isGuest: false
      });
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await fetch(`${baseUrl}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        localStorage.setItem('user_token', data.token);
        localStorage.removeItem('guest_mode');
        
        setAuthState({
          user: parseUserDates(data.user),
          isAuthenticated: true,
          isLoading: false,
          isGuest: false
        });
        
        return true;
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await fetch(`${baseUrl}/api/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        localStorage.setItem('user_token', data.token);
        localStorage.removeItem('guest_mode');
        
        setAuthState({
          user: parseUserDates(data.user),
          isAuthenticated: true,
          isLoading: false,
          isGuest: false
        });
        
        return true;
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('guest_mode');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isGuest: false
    });
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) return false;
      
      const response = await fetch(`${baseUrl}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAuthState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, ...parseUserDates(data.user) } : null
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  const updatePreferences = async (preferences: Partial<UserPreferences>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token || !authState.user) return false;
      
      const response = await fetch(`${baseUrl}/api/user/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAuthState(prev => ({
          ...prev,
          user: prev.user ? {
            ...prev.user,
            preferences: { ...prev.user.preferences, ...preferences }
          } : null
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Preferences update error:', error);
      return false;
    }
  };

  const switchToGuest = () => {
    localStorage.setItem('guest_mode', 'true');
    localStorage.removeItem('user_token');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isGuest: true
    });
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) return;
      
      const response = await fetch(`${baseUrl}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuthState(prev => ({
          ...prev,
          user: parseUserDates(data.user)
        }));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const contextValue: UserContextType = {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    updatePreferences,
    switchToGuest,
    refreshUser
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
