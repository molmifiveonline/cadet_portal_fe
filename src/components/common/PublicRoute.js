import React from 'react';
import { useAuth } from 'context/AuthContext';
import { Navigate } from 'react-router-dom';

// Public Route Component (redirects to dashboard if already logged in)
export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

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

  if (user) {
    return <Navigate to='/dashboard' replace />;
  }

  return children;
};