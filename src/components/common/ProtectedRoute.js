import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPrefixRoute, isAllowedRoute, getLoginRedirectPath } from '../../lib/utils/routeUtils';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-indigo-100'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto'></div>
          <p className='mt-4 text-gray-600 font-medium'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const redirectPath = getLoginRedirectPath(location.pathname);
    return <Navigate to={redirectPath} replace />;
  }

  // For intent-based users (e.g. Institute temp logins):
  // Check if the current route is allowed for their intent.
  // If not, redirect them to their primary route.
  if (!isAllowedRoute(user, location.pathname)) {
    const prefixRoute = getPrefixRoute(user);
    if (prefixRoute) {
      return <Navigate to={prefixRoute} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
