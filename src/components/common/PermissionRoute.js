import React from 'react';
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
    return (
      <div className='flex items-center justify-center h-full min-h-[400px] bg-gray-50 rounded-lg'>
        <div className='text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200 max-w-md'>
          <div className='w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-8 w-8'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
              />
            </svg>
          </div>
          <h2 className='text-xl font-bold text-gray-900 mb-2'>
            Access Denied
          </h2>
          <p className='text-gray-500'>
            You do not have permission to view this page. Please navigate to a
            different section using the menu.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default PermissionRoute;
