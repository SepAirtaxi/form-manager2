import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PasswordIcon from '@mui/icons-material/Password';
import { 
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  sendPasswordReset
} from '../../../services/users/userService';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('create'); // 'create', 'edit', 'delete'
  const [dialogSubmitting, setDialogSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    id: '',
    name: '',
    email: '',
    role: 'employee',
    password: ''
  });
  const [saveStatus, setSaveStatus] = useState(null);
  
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userList = await getUsers();
        setUsers(userList);
      } catch (error) {
        console.error('Error loading users:', error);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, []);
  
  const handleOpenDialog = (type, user = null) => {
    setDialogType(type);
    
    if (user) {
      setCurrentUser({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        password: ''
      });
    } else {
      setCurrentUser({
        id: '',
        name: '',
        email: '',
        role: 'employee',
        password: ''
      });
    }
    
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentUser({
      id: '',
      name: '',
      email: '',
      role: 'employee',
      password: ''
    });
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentUser(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmitDialog = async () => {
    try {
      setDialogSubmitting(true);
      
      if (dialogType === 'create') {
        await createUser(currentUser.email, currentUser.password, currentUser.name, currentUser.role);
        setSaveStatus({ error: false, message: 'User created successfully' });
      } else if (dialogType === 'edit') {
        const { password, ...userData } = currentUser;
        await updateUser(currentUser.id, userData);
        setSaveStatus({ error: false, message: 'User updated successfully' });
      } else if (dialogType === 'delete') {
        await deleteUser(currentUser.id);
        setSaveStatus({ error: false, message: 'User deleted successfully' });
      }
      
      // Reload users
      const userList = await getUsers();
      setUsers(userList);
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error processing user:', error);
      setSaveStatus({ error: true, message: `Error ${dialogType === 'create' ? 'creating' : dialogType === 'edit' ? 'updating' : 'deleting'} user` });
    } finally {
      setDialogSubmitting(false);
      
      // Clear save status after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    }
  };
  
  const handleSendPasswordReset = async (email) => {
    try {
      await sendPasswordReset(email);
      setSaveStatus({ error: false, message: 'Password reset email sent' });
    } catch (error) {
      console.error('Error sending password reset:', error);
      setSaveStatus({ error: true, message: 'Error sending password reset email' });
    }
    
    // Clear save status after 3 seconds
    setTimeout(() => {
      setSaveStatus(null);
    }, 3000);
  };
  
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'primary';
      default:
        return 'default';
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          Add User
        </Button>
      </Box>
      
      {saveStatus && (
        <Alert 
          severity={saveStatus.error ? 'error' : 'success'} 
          sx={{ mb: 2 }}
        >
          {saveStatus.message}
        </Alert>
      )}
      
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role} 
                      color={getRoleColor(user.role)} 
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog('edit', user)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleSendPasswordReset(user.email)}
                    >
                      <PasswordIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleOpenDialog('delete', user)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No users found. Click "Add User" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* User Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'create' 
            ? 'Add New User' 
            : dialogType === 'edit' 
              ? 'Edit User' 
              : 'Delete User'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'delete' ? (
            <Typography>
              Are you sure you want to delete the user {currentUser.name} ({currentUser.email})?
              This action cannot be undone.
            </Typography>
          ) : (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={currentUser.name}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={currentUser.email}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              {dialogType === 'create' && (
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={currentUser.password}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                />
              )}
              <FormControl fullWidth margin="normal">
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  id="role-select"
                  name="role"
                  value={currentUser.role}
                  label="Role"
                  onChange={handleInputChange}
                >
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitDialog} 
            variant="contained" 
            color={dialogType === 'delete' ? 'error' : 'primary'}
            disabled={dialogSubmitting}
          >
            {dialogType === 'create' 
              ? 'Create' 
              : dialogType === 'edit' 
                ? 'Save' 
                : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserManagement;