import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types/api';
import { apiClient, api } from '@/lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = apiClient.getAccessToken();
      if (token) {
        try {
          const userData = await api.auth.me();
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          // Token might be expired, try to refresh
          const newToken = await apiClient.refreshAccessToken();
          if (newToken) {
            try {
              const userData = await api.auth.me();
              setUser(userData);
            } catch (retryError) {
              // Refresh failed, clear tokens
              apiClient.clearTokens();
            }
          } else {
            apiClient.clearTokens();
          }
        }
      }
      setLoading(false);
    };

    checkSession().catch((error) => {
      console.error('Session check failed:', error);
      setLoading(false);
    });
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await api.auth.login(credentials);
      const { access_token, refresh_token, user: userData } = response;

      // Store tokens
      apiClient.setTokens(access_token, refresh_token);

      // Set user
      setUser(userData);

      toast.success('登录成功！');
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败';
      toast.error(message);
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await api.auth.register(data);
      const { access_token, refresh_token, user: userData } = response;

      // Store tokens
      apiClient.setTokens(access_token, refresh_token);

      // Set user
      setUser(userData);

      toast.success('注册成功！');
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : '注册失败';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local tokens and user state
      apiClient.clearTokens();
      setUser(null);
      toast.success('已退出登录');
      navigate('/');
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await api.auth.me();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // Try to refresh token
      const newToken = await apiClient.refreshAccessToken();
      if (newToken) {
        try {
          const userData = await api.auth.me();
          setUser(userData);
        } catch (retryError) {
          apiClient.clearTokens();
          setUser(null);
        }
      } else {
        apiClient.clearTokens();
        setUser(null);
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
