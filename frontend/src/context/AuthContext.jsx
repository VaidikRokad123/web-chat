import { createContext, useContext, useState, useEffect } from 'react';
import { post, get } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  async function fetchProfile() {
    try {
      const data = await get('/user/profile');
      setUser(data.user);
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const data = await post('/user/login', { email, password }, false);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function register(email, password, extras = {}) {
    const data = await post('/user/register', { email, password, ...extras }, false);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function logout() {
    try {
      await post('/user/logout', {});
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
  }

  function handleGoogleCallback(token) {
    setToken(token);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, handleGoogleCallback }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
