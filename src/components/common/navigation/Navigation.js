import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Typography,
  Box
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import { useAuth } from '../../../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../../services/firebase/config';

function Navigation() {
  const { isManager, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Form Manager
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {/* Forms - Available to all users */}
        <ListItem 
          button 
          selected={location.pathname === '/dashboard'}
          onClick={() => navigate('/dashboard')}
        >
          <ListItemIcon>
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText primary="Available Forms" />
        </ListItem>

        {/* My Forms - Available to all users */}
        <ListItem 
          button 
          selected={location.pathname === '/forms'}
          onClick={() => navigate('/forms')}
        >
          <ListItemIcon>
            <DescriptionIcon />
          </ListItemIcon>
          <ListItemText primary="My Forms" />
        </ListItem>
        
        {/* Admin Dashboard - Available to managers and admins */}
        {isManager && (
          <ListItem 
            button 
            selected={location.pathname.startsWith('/admin')}
            onClick={() => navigate('/admin')}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Admin Dashboard" />
          </ListItem>
        )}
        
        {/* Settings - Available to managers and admins */}
        {isManager && (
          <ListItem 
            button 
            selected={location.pathname === '/admin/settings'}
            onClick={() => navigate('/admin/settings')}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
        )}
        
        {/* User Management - Available to admins only */}
        {isAdmin && (
          <ListItem 
            button 
            selected={location.pathname === '/admin/users'}
            onClick={() => navigate('/admin/users')}
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Users" />
          </ListItem>
        )}
      </List>
      <Divider />
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
        <List>
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Box>
    </div>
  );
}

export default Navigation;