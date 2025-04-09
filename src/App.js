import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Login from './components/auth/Login';
import UserDashboard from './components/user/dashboard/UserDashboard';
import AdminDashboard from './components/admin/dashboard/AdminDashboard';
import Layout from './components/common/layout/Layout';
import FormEditor from './components/admin/forms/FormEditor';
import FormPreview from './components/admin/forms/FormPreview';
import FormViewer from './components/user/forms/FormViewer';
import UserForms from './components/user/forms/UserForms';
import Settings from './components/admin/settings/Settings';
import UserManagement from './components/admin/users/UserManagement';

// Protected route component
const ProtectedRoute = ({ element, requiredRole }) => {
  const { currentUser, hasRole } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && !hasRole(requiredRole)) {
    // Redirect to appropriate dashboard based on role
    if (hasRole('admin') || hasRole('manager')) {
      return <Navigate to="/admin" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }
  
  return element;
};

function AppRoutes() {
  const auth = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* User routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute 
            element={
              <Layout>
                <UserDashboard />
              </Layout>
            } 
            requiredRole="employee" 
          />
        } 
      />
      
      <Route 
        path="/form/:formId" 
        element={
          <ProtectedRoute 
            element={
              <Layout>
                <FormViewer />
              </Layout>
            }
            requiredRole="employee" 
          />
        } 
      />
      
      <Route 
        path="/my-forms" 
        element={
          <ProtectedRoute 
            element={
              <Layout>
                <UserForms />
              </Layout>
            }
            requiredRole="employee" 
          />
        } 
      />
      
      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute 
          element={
            <Layout isAdmin>
              <AdminDashboard />
            </Layout>
          } 
          requiredRole="manager" 
        />
      } />
      
      <Route path="/admin/forms/create" element={
        <ProtectedRoute 
          element={
            <Layout isAdmin>
              <FormEditor />
            </Layout>
          } 
          requiredRole="manager" 
        />
      } />
      
      <Route path="/admin/forms/edit/:formId" element={
        <ProtectedRoute 
          element={
            <Layout isAdmin>
              <FormEditor />
            </Layout>
          } 
          requiredRole="manager" 
        />
      } />
      
      <Route path="/admin/forms/preview/:formId" element={
        <ProtectedRoute 
          element={
            <Layout isAdmin>
              <FormPreview />
            </Layout>
          } 
          requiredRole="manager" 
        />
      } />
      
      <Route path="/admin/settings" element={
        <ProtectedRoute 
          element={
            <Layout isAdmin>
              <Settings />
            </Layout>
          } 
          requiredRole="manager" 
        />
      } />
      
      <Route path="/admin/users" element={
        <ProtectedRoute 
          element={
            <Layout isAdmin>
              <UserManagement />
            </Layout>
          } 
          requiredRole="admin" 
        />
      } />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to={auth.currentUser ? (auth.hasRole('manager') ? "/admin" : "/dashboard") : "/login"} />} />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;