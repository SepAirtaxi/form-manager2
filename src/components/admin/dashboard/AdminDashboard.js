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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import AddIcon from '@mui/icons-material/Add';
import { formatTimestamp } from '../../../utils/dateUtils';

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
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
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
  
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (tabValue !== 1) return;
      
      try {
        setSubmissionsLoading(true);
        
        // Get the 20 most recent submissions
        const submissionsQuery = query(
          collection(db, 'submissions'),
          orderBy('submittedAt', 'desc'),
          limit(20)
        );
        
        const submissionsSnapshot = await getDocs(submissionsQuery);
        
        // Create a map to hold form titles
        const formTitles = {};
        forms.forEach(form => {
          formTitles[form.id] = form.title;
        });
        
        // Get user data for usernames
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = {};
        usersSnapshot.docs.forEach(doc => {
          users[doc.id] = doc.data().name;
        });
        
        const submissionsList = [];
        
        for (const doc of submissionsSnapshot.docs) {
          const submission = {
            id: doc.id,
            ...doc.data(),
            formTitle: formTitles[doc.data().formId] || 'Unknown Form',
            userName: users[doc.data().userId] || 'Unknown User'
          };
          
          submissionsList.push(submission);
        }
        
        setSubmissions(submissionsList);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setSubmissionsLoading(false);
      }
    };
    
    fetchSubmissions();
  }, [tabValue, forms]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleCreateForm = () => {
    navigate('/admin/forms/create');
  };

  const handleViewSubmission = (submissionId) => {
    navigate(`/admin/submissions/${submissionId}`);
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
                    onClick={() => navigate(`/admin/forms/edit/${form.id}`)}
                  >
                    Edit
                  </Button>
                  {form.published && (
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => navigate(`/admin/forms/preview/${form.id}`)}
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
        <Typography variant="h6" gutterBottom>Recent Form Submissions</Typography>
        
        {submissionsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Form</TableCell>
                  <TableCell>Submitted By</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{submission.formTitle}</TableCell>
                    <TableCell>{submission.userName}</TableCell>
                    <TableCell>
                      {submission.submittedAt ? 
                        formatTimestamp(submission.submittedAt) : 
                        'Unknown date'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        onClick={() => handleViewSubmission(submission.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                
                {submissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No submissions yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
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
                <Button 
                  size="small" 
                  color="primary"
                  onClick={() => {
                    // We'll implement this later
                    alert('This feature is not yet implemented');
                  }}
                >
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
                  onClick={() => navigate('/admin/settings')}
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
                  onClick={() => navigate('/admin/users')}
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