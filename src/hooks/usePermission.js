import { usePermissionContext } from '../context/PermissionContext';

/**
 * Hook to check if user has specific permission
 * @param {string} module - Module name (e.g., 'cadets', 'users')
 * @param {string} action - Action name (e.g., 'create', 'edit', 'delete', 'view')
 * @returns {object} - { hasPermission: boolean, loading: boolean }
 */
export const usePermission = (module, action) => {
  const { hasPermission, loading } = usePermissionContext();
  return { hasPermission: hasPermission(module, action), loading };
};

/**
 * Hook to get all permissions for current user
 * @returns {object} - { permissions: [], loading: boolean, hasPermission: function }
 */
export const useUserPermissions = () => {
  return usePermissionContext();
};

export default usePermission;
