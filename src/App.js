import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import CadetManagement from './pages/CadetManagement';
import MainLayout from './components/layout/MainLayout';
import ResetPassword from './pages/auth/ResetPassword';
import InstitutesManagement from 'pages/institutes/InstitutesManagement';
import InstituteForm from 'pages/institutes/InstituteForm';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
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

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position='top-center' richColors expand={false} />
        <Routes>
          <Route path='/reset-password' element={<ResetPassword />} />
          {/* Public Routes */}
          <Route
            path='/login'
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route path='/' element={<Navigate to='/login' replace />} />

          {/* Protected Routes with Layout */}
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path='/institutes'
            element={
              <ProtectedRoute>
                <MainLayout>
                  <InstitutesManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path='/institutes/addNewInstitue'
            element={
              <ProtectedRoute>
                <MainLayout>
                  <InstituteForm />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path='/institutes/edit/:id'
            element={
              <ProtectedRoute>
                <MainLayout>
                  <InstituteForm />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path='/cadets'
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CadetManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to login */}
          <Route path='*' element={<Navigate to='/login' replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
