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
import ShortlistedCadetsView from './pages/CadetManagement/ShortlistedCadetsView';
import MainLayout from './components/layout/MainLayout';
import ResetPassword from './pages/auth/ResetPassword';
import ActivityLogs from './pages/ActivityLogs/ActivityLogs';
import UserManagement from './pages/Users';
import UserForm from './pages/Users/UserForm';
import InstitutesManagement from 'pages/institutes';
import InstituteForm from 'pages/institutes/InstituteForm';
import SubmitExcel from 'pages/institutes/SubmitExcel';
import InstituteShortlistedCadets from 'pages/institutes/InstituteShortlistedCadets';
import InstituteSubmissions from 'pages/institutes/InstituteSubmissions';
import RolePermissions from './pages/RolePermissions';
import VesselList from './pages/vessels';
import VesselForm from './pages/vessels/VesselForm';
import MedicalCenterList from './pages/medical-centers';
import MedicalCenterForm from './pages/medical-centers/MedicalCenterForm';
import AssessmentForm from './pages/Assessments/AssessmentForm';
import AssessmentManagement from './pages/Assessments';

import ProtectedRoute from './components/common/ProtectedRoute';
import PermissionRoute from './components/common/PermissionRoute';
import { PublicRoute } from './components/common/PublicRoute';
import HomeRedirect from './components/common/HomeRedirect';

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
            <Route path='/' element={<HomeRedirect />} />

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
                    <SubmitExcel />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/institute/shortlisted-cadets'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <InstituteShortlistedCadets />
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
              path='/cadets/engine'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='cadets' action='view'>
                      <CadetManagement courseType='Engine' />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/cadets/deck'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='cadets' action='view'>
                      <CadetManagement courseType='Deck' />
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
              path='/assessments'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='tests' action='view'>
                      <AssessmentManagement />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/cadets/assess/:cadet_id'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='cadets' action='edit'>
                      <AssessmentForm />
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

            {/* Vessel Master Routes */}
            <Route
              path='/vessels'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='vessel-master' action='view'>
                      <VesselList />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/vessels/add'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='vessel-master' action='create'>
                      <VesselForm />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/vessels/edit/:id'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='vessel-master' action='edit'>
                      <VesselForm />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Medical Center Master Routes */}
            <Route
              path='/medical-centers'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='medical-centers' action='view'>
                      <MedicalCenterList />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/medical-centers/add'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='medical-centers' action='create'>
                      <MedicalCenterForm />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/medical-centers/edit/:id'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='medical-centers' action='edit'>
                      <MedicalCenterForm />
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
