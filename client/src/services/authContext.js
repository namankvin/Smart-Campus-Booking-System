import React, { useState, useContext, createContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [ready, setReady] = useState(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken) {
      return true;
    }

    return Boolean(storedUser);
  });

  useEffect(() => {
    const syncProfile = async () => {
      if (!token) {
        setReady(true);
        return;
      }

      if (user) {
        setReady(true);
        return;
      }

      try {
        const res = await authService.getProfile();
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } catch {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setReady(true);
      }
    };
    syncProfile();
  }, [token, user]);

  const login = async (credentials) => {
    try {
      const isDevLogin = credentials?.mode === 'dev';
      const response = isDevLogin
        ? await authService.devLogin(credentials)
        : await authService.login(credentials);
      setToken(response.data.token);
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setReady(true);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setReady(true);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};