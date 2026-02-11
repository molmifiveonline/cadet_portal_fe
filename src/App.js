import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import CadetManagement from './pages/CadetManagement';
import MainLayout from './components/layout/MainLayout';
import ResetPassword from './pages/auth/ResetPassword';
import ActivityLogs from './pages/ActivityLogs/ActivityLogs';
import UserManagement from './pages/Users';
import InstitutesManagement from 'pages/institutes';
import InstituteForm from 'pages/institutes/InstituteForm';
import RolePermissions from './pages/RolePermissions';

import ProtectedRoute from './components/common/ProtectedRoute';
import PermissionRoute from './components/common/PermissionRoute';
import { PublicRoute } from 'components/common/PublicRoute';

function App() {
  return (
    <AuthProvider>
      <PermissionProvider>
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
                    <PermissionRoute module='dashboard' action='view'>
                      <Dashboard />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/institutes'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='institutes' action='view'>
                      <InstitutesManagement />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/institutes/addNewInstitue'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='institutes' action='create'>
                      <InstituteForm />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/institutes/edit/:id'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='institutes' action='edit'>
                      <InstituteForm />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/cadets'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='cadets' action='view'>
                      <CadetManagement />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/activity-logs'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='activity-logs' action='view'>
                      <ActivityLogs />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/users'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='users' action='view'>
                      <UserManagement />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/role-permissions'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='role-permissions' action='manage'>
                      <RolePermissions />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to login */}
            <Route path='*' element={<Navigate to='/login' replace />} />
          </Routes>
        </Router>
      </PermissionProvider>
    </AuthProvider>
  );
}

export default App;
