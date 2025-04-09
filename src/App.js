import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Placeholder components - we'll create these next
import Login from './components/auth/Login';
import UserDashboard from './components/user/dashboard/UserDashboard';
import AdminDashboard from './components/admin/dashboard/AdminDashboard';
import Layout from './components/common/layout/Layout';

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
      
      {/* Admin routes */}
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute 
            element={
              <Layout isAdmin>
                <AdminDashboard />
              </Layout>
            } 
            requiredRole="manager" 
          />
        } 
      />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to={auth.currentUser ? (auth.hasRole('manager') ? "/admin" : "/dashboard") : "/login"} />} />
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