import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext';
import api from '../lib/utils/apiConfig';

const PermissionContext = createContext();

export const usePermissionContext = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error(
      'usePermissionContext must be used within PermissionProvider',
    );
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/role-permissions/me/permissions');
      if (response.data && response.data.success) {
        setPermissions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (module, action) => {
      // SuperAdmin always has all permissions
      if (user?.role === 'SuperAdmin') {
        return true;
      }

      return permissions.some(
        (perm) => perm.module === module && perm.action === action,
      );
    },
    [user, permissions],
  );

  const value = {
    permissions,
    loading,
    hasPermission,
    refreshPermissions: fetchPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
