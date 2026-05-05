import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';
import { getLogoutRedirectPath } from '../lib/utils/routeUtils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutTimerRef = useRef(null);

  // Schedule auto-logout based on temp_expiry from DB
  const scheduleAutoLogout = (userData) => {
    // Clear any existing timer
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    // Only for institute users with temp_expiry
    if (!userData?.temp_expiry) return;

    const expiryTime = new Date(userData.temp_expiry).getTime();
    const now = Date.now();
    const remainingMs = expiryTime - now;

    if (remainingMs <= 0) {
      // Already expired — logout immediately
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = getLogoutRedirectPath(userData);
      return;
    }

    console.log(
      `[Auth] Auto-logout scheduled in ${Math.round(remainingMs / 1000)}s`,
    );
    logoutTimerRef.current = setTimeout(() => {
      console.log('[Auth] Credentials expired — auto-logging out');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = getLogoutRedirectPath(userData);
    }, remainingMs);
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      scheduleAutoLogout(parsed);
    }
    setLoading(false);

    // Sync auth state across browser tabs
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        const newToken = localStorage.getItem('token');
        const newUser = localStorage.getItem('user');

        if (!newToken || !newUser) {
          // Another tab logged out → logout this tab too
          if (logoutTimerRef.current) {
            clearTimeout(logoutTimerRef.current);
            logoutTimerRef.current = null;
          }
          setUser(null);
        } else {
          // Another tab logged in → update this tab
          try {
            const parsed = JSON.parse(newUser);
            setUser(parsed);
            scheduleAutoLogout(parsed);
          } catch (err) {
            console.error('[Auth] Error parsing user from storage event', err);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    scheduleAutoLogout(userData);
  };

  const logout = () => {
    const redirectPath = getLogoutRedirectPath(user);

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    return redirectPath;
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
