import React, { Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import PermissionRoute from './components/common/PermissionRoute';
import { PublicRoute } from './components/common/PublicRoute';
import HomeRedirect from './components/common/HomeRedirect';
import PageLoader from './components/common/PageLoader';
import { getLoginRedirectPath } from './lib/utils/routeUtils';

const Login = lazy(() => import('./pages/auth/Login'));
const InstituteLogin = lazy(() => import('./pages/auth/InstituteLogin'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CadetManagement = lazy(() => import('./pages/CadetManagement'));
const CadetDetails = lazy(() => import('./pages/CadetManagement/CadetDetails'));
const CadetPendingDetails = lazy(() => import('./pages/CadetManagement/CadetPendingDetails'));
const AddCadetForm = lazy(() => import('./pages/CadetManagement/AddCadetForm'));
const ShortlistedCadetsView = lazy(() => import('./pages/CadetManagement/ShortlistedCadetsView'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs/ActivityLogs'));
const UserManagement = lazy(() => import('./pages/Users'));
const UserForm = lazy(() => import('./pages/Users/UserForm'));
const InstitutesManagement = lazy(() => import('pages/institutes'));
const InstituteForm = lazy(() => import('pages/institutes/InstituteForm'));
const SubmitExcel = lazy(() => import('pages/institutes/SubmitExcel'));
const InstituteShortlistedCadets = lazy(() => import('pages/institutes/InstituteShortlistedCadets'));
const InstituteSubmissions = lazy(() => import('pages/institutes/InstituteSubmissions'));
const RolePermissions = lazy(() => import('./pages/RolePermissions'));
const VesselList = lazy(() => import('./pages/vessels'));
const VesselForm = lazy(() => import('./pages/vessels/VesselForm'));
const MedicalCenterList = lazy(() => import('./pages/medical-centers'));
const MedicalCenterForm = lazy(() => import('./pages/medical-centers/MedicalCenterForm'));
const AssessmentForm = lazy(() => import('./pages/Assessments/AssessmentForm'));
const AssessmentManagement = lazy(() => import('./pages/Assessments'));
const InterviewForm = lazy(() => import('./pages/Assessments/InterviewForm'));
const MedicalResultForm = lazy(() => import('./pages/Assessments/MedicalResultForm'));
const InterviewManagement = lazy(() => import('./pages/Assessments/InterviewManagement'));
const MedicalManagement = lazy(() => import('./pages/Assessments/MedicalManagement'));
const RecruitmentDrives = lazy(() => import('./pages/RecruitmentDrives'));
const DriveForm = lazy(() => import('./pages/RecruitmentDrives/DriveForm'));
const DriveDetails = lazy(() => import('./pages/RecruitmentDrives/DriveDetails'));
const NotificationHistory = lazy(() => import('./pages/Notifications/NotificationHistory'));

function App() {
  return (
    <AuthProvider>
      <PermissionProvider>
        <Router>
          <Toaster position='top-center' richColors expand={false} />
          <Suspense fallback={<PageLoader />}>
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
            <Route
              path='/institute-login'
              element={
                <PublicRoute>
                  <InstituteLogin />
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
              path='/notifications'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <NotificationHistory />
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
              path='/institutes/addNewInstitute'
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
              path='/drives'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='recruitment_drives' action='view'>
                      <RecruitmentDrives />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/drives/new'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='recruitment_drives' action='create'>
                      <DriveForm />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/drives/edit/:id'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='recruitment_drives' action='edit'>
                      <DriveForm />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/drives/:id'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='recruitment_drives' action='view'>
                      <DriveDetails />
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
              path='/cadets/fill-details/:id'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CadetPendingDetails />
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
              path='/cadets/interview/:cadet_id'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='cadets' action='edit'>
                      <InterviewForm />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/interviews'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='tests' action='view'>
                      <InterviewManagement />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/medical'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='medical' action='view'>
                      <MedicalManagement />
                    </PermissionRoute>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/cadets/medical/:cadet_id'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PermissionRoute module='cadets' action='edit'>
                      <MedicalResultForm />
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

            {/* Catch all - redirect to login based on context */}
            <Route
              path='*'
              element={<Navigate to={getLoginRedirectPath(window.location.pathname)} replace />}
            />
          </Routes>
          </Suspense>
        </Router>
      </PermissionProvider>
    </AuthProvider>
  );
}

export default App;
