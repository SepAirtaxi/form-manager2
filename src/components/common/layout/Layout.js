import React, { useState } from 'react';
import { 
  AppBar, 
  Box, 
  Drawer, 
  IconButton, 
  Toolbar, 
  Typography, 
  Container,
  useMediaQuery,
  Alert
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../../contexts/AuthContext';
import Navigation from '../navigation/Navigation';

const drawerWidth = 240;

function Layout({ children, isAdmin = false }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isManager, isAdmin: userIsAdmin } = useAuth();
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Show warning for admin functions on mobile
  const showMobileWarning = isMobile && (isAdmin && (isManager || userIsAdmin));

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Form Manager
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          <Navigation />
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          <Navigation />
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8 // Below app bar
        }}
      >
        {showMobileWarning && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Admin functions are optimized for desktop. Some features may be difficult to use on mobile devices.
          </Alert>
        )}
        
        <Container className={isAdmin ? 'admin-container' : ''}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}

export default Layout;