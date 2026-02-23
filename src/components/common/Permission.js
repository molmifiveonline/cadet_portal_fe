import React from 'react';
import usePermission from '../../hooks/usePermission';

/**
 * ================================================
 * PERMISSION COMPONENT
 * Conditionally renders children based on user permission
 * ================================================
 */

/**
 * Permission wrapper component
 * @param {string} module - Module name (e.g., 'cadets', 'users')
 * @param {string} action - Action name (e.g., 'create', 'edit', 'delete', 'view')
 * @param {React.ReactNode} children - Content to render if permission is granted
 * @param {React.ReactNode} fallback - Optional content to render if permission is denied
 */
const Permission = ({ module, action, children, fallback = null }) => {
  const { hasPermission, loading } = usePermission(module, action);

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (!hasPermission) {
    return fallback;
  }

  return <>{children}</>;
};

export default Permission;
