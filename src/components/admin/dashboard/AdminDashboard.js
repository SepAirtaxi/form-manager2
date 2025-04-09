import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button,
  Box,
  Tabs,
  Tab
} from '@mui/material';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import AddIcon from '@mui/icons-material/Add';

// Import Admin sub-components (we'll create these later)
// import FormEditor from '../forms/FormEditor';
// import CompanySettings from '../settings/CompanySettings';
// import UserManagement from '../users/UserManagement';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function AdminDashboard() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'forms'));
        const formsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setForms(formsList);
      } catch (error) {
        console.error('Error fetching forms:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchForms();
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleCreateForm = () => {
    navigate('/admin/forms/create');
  };
  
  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
          <Tab label="Forms" />
          <Tab label="Recent Submissions" />
          <Tab label="Tools" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleCreateForm}
          >
            Create New Form
          </Button>
        </Box>
        
        {loading && <Typography>Loading forms...</Typography>}
        
        <Grid container spacing={3}>
          {forms.map((form) => (
            <Grid item xs={12} sm={6} md={4} key={form.id}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h2">
                    {form.title}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Rev. {form.revision}
                  </Typography>
                  <Typography variant="body2" component="p">
                    {form.description}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Status: {form.published ? 'Published' : 'Draft'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color="primary"
                    href={`/admin/forms/edit/${form.id}`}
                  >
                    Edit
                  </Button>
                  {form.published && (
                    <Button 
                      size="small" 
                      color="primary"
                      href={`/admin/forms/preview/${form.id}`}
                    >
                      Preview
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
          
          {!loading && forms.length === 0 && (
            <Grid item xs={12}>
              <Typography>No forms created yet. Click "Create New Form" to get started.</Typography>
            </Grid>
          )}
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6">Recent Form Submissions</Typography>
        <Typography>
          This section will display recently submitted forms.
        </Typography>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6">Admin Tools</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2">
                  Test PDF Generation
                </Typography>
                <Typography variant="body2" component="p">
                  Generate a test PDF to verify the output formatting.
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  Generate Test PDF
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2">
                  Company Settings
                </Typography>
                <Typography variant="body2" component="p">
                  Configure company information for form headers.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  color="primary"
                  href="/admin/settings"
                >
                  Open Settings
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2">
                  User Management
                </Typography>
                <Typography variant="body2" component="p">
                  Manage users and access permissions.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  color="primary"
                  href="/admin/users"
                >
                  Manage Users
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </div>
  );
}

export default AdminDashboard;