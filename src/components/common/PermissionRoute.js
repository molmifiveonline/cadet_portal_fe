import React from 'react';
import { Navigate } from 'react-router-dom';
import usePermission from '../../hooks/usePermission';

const PermissionRoute = ({ module, action, children }) => {
  const { hasPermission, loading } = usePermission(module, action);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full min-h-[400px]'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto'></div>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    // Redirect to dashboard or show access denied
    return <Navigate to='/dashboard' replace />;
  }

  return children;
};

export default PermissionRoute;
