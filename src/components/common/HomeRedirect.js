import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermissionContext } from '../../context/PermissionContext';
import { MenuItems } from '../../lib/utils/menu';
import { getPrefixRoute } from '../../lib/utils/routeUtils';

const HomeRedirect = () => {
  const { user, loading: authLoading } = useAuth();
  const { loading: permLoading, hasPermission } = usePermissionContext();

  if (authLoading || permLoading) {
    return (
      <div className='flex items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-indigo-100'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto'></div>
          <p className='mt-4 text-gray-600 font-medium'>
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  const prefixRoute = getPrefixRoute(user);
  if (prefixRoute) {
    return <Navigate to={prefixRoute} replace />;
  }

  // Find the first menu item the user has permission to access
  for (const item of MenuItems) {
    // If it's a dropdown menu with subItems, check its subItems
    if (item.subItems) {
      for (const sub of item.subItems) {
        if (hasPermission(sub.module, sub.action)) {
          return <Navigate to={sub.url} replace />;
        }
      }
    } else {
      // Check top-level item
      if (item.url && hasPermission(item.module, item.action)) {
        return <Navigate to={item.url} replace />;
      }
    }
  }

  // Fallback if no permissions match (or return default unauthorized view)
  return <Navigate to='/dashboard' replace />;
};

export default HomeRedirect;
