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
import CadetDetails from './pages/CadetManagement/CadetDetails';
import AddCadetForm from './pages/CadetManagement/AddCadetForm';
import AddCadetBasicForm from './pages/CadetManagement/AddCadetBasicForm';
import ShortlistedCadetsView from './pages/CadetManagement/ShortlistedCadetsView';
import MainLayout from './components/layout/MainLayout';
import ResetPassword from './pages/auth/ResetPassword';
import ActivityLogs from './pages/ActivityLogs/ActivityLogs';
import UserManagement from './pages/Users';
import UserForm from './pages/Users/UserForm';
import InstitutesManagement from 'pages/institutes';
import InstituteForm from 'pages/institutes/InstituteForm';
import SubmitExcel from 'pages/institutes/SubmitExcel';
import InstituteSubmissions from 'pages/institutes/InstituteSubmissions';
import RolePermissions from './pages/RolePermissions';
import CVForm from './pages/CVForm';

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
            <Route path='/cv-form/:token' element={<CVForm />} />

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
              path='/institute/submit-excel'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    {/* Applying a generic view permission check, or specifically for 'institutes' 'submit' later if needed */}
                    <SubmitExcel />
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
              path='/institutes/submissions'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='institutes' action='view'>
                      <InstituteSubmissions />
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
              path='/cadets/shortlist'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='cadets' action='view'>
                      <ShortlistedCadetsView />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/cadets/add'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='cadets' action='create'>
                      <AddCadetForm />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/cadets/add-basic'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='cadets' action='create'>
                      <AddCadetBasicForm />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/cadets/view/:id'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='cadets' action='view'>
                      <CadetDetails />
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
              path='/users/addUser'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='users' action='create'>
                      <UserForm />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/users/edit/:id'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='users' action='edit'>
                      <UserForm />
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
