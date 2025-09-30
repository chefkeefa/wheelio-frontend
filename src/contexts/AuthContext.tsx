'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest, UseAuthReturn } from '@/types/marketplace';
import authService from '@/lib/auth';

interface AuthContextType extends UseAuthReturn {}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state from storage
    const initializeAuth = () => {
      const currentUser = authService.getUser();
      setUser(currentUser);
      setIsLoading(false);
    };

    initializeAuth();

    // Set up automatic token refresh
    const setupTokenRefresh = () => {
      const checkAndRefreshToken = async () => {
        if (authService.isAuthenticated() && authService.shouldRefreshToken()) {
          try {
            await authService.refreshAccessToken();
            const updatedUser = authService.getUser();
            setUser(updatedUser);
          } catch (error) {
            console.error('Automatic token refresh failed:', error);
            setUser(null);
          }
        }
      };

      // Check every 5 minutes
      const interval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);
      
      // Also check on window focus
      const handleFocus = () => {
        checkAndRefreshToken();
      };
      
      window.addEventListener('focus', handleFocus);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
    };

    const cleanup = setupTokenRefresh();
    
    return cleanup;
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      setUser(response.user);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    authService.logout();
    setUser(null);
  };

  const refreshToken = async (): Promise<void> => {
    try {
      await authService.refreshAccessToken();
      const updatedUser = authService.getUser();
      setUser(updatedUser);
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const isAuthenticated = Boolean(user);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;