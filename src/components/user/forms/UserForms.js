import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, getDocs, getDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
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

function UserForms() {
  const [tabValue, setTabValue] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const loadUserForms = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Get all forms first to map titles
        const formsSnapshot = await getDocs(collection(db, 'forms'));
        const forms = {};
        formsSnapshot.docs.forEach(doc => {
          forms[doc.id] = doc.data().title;
        });
        
        // Get user's submissions
        const submissionsQuery = query(
          collection(db, 'submissions'),
          where('userId', '==', currentUser.uid)
        );
        
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissionsList = [];
        
        for (const doc of submissionsSnapshot.docs) {
          const formId = doc.data().formId;
          const formTitle = forms[formId] || 'Unknown Form';
          
          submissionsList.push({
            id: doc.id,
            ...doc.data(),
            formTitle
          });
        }
        
        // Get user's drafts
        const draftsQuery = query(
          collection(db, 'drafts'),
          where('userId', '==', currentUser.uid)
        );
        
        const draftsSnapshot = await getDocs(draftsQuery);
        const draftsList = [];
        
        for (const doc of draftsSnapshot.docs) {
          const formId = doc.data().formId;
          const formTitle = forms[formId] || 'Unknown Form';
          
          draftsList.push({
            id: doc.id,
            ...doc.data(),
            formTitle
          });
        }
        
        setSubmissions(submissionsList);
        setDrafts(draftsList);
      } catch (error) {
        console.error('Error loading user forms:', error);
        setError('Failed to load your forms. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserForms();
  }, [currentUser]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleViewSubmission = (submissionId) => {
    navigate(`/admin/submissions/${submissionId}`);
  };
  
  const handleContinueDraft = (formId) => {
    navigate(`/form/${formId}`);
  };
  
  const handleDeleteDraft = async (draftId) => {
    if (!window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'drafts', draftId));
      
      // Update the list by removing the deleted draft
      setDrafts(drafts.filter(draft => draft.id !== draftId));
    } catch (error) {
      console.error('Error deleting draft:', error);
      setError('Failed to delete draft. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        My Forms
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="form tabs">
            <Tab label="Submitted Forms" />
            <Tab label="Drafts" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          {submissions.length > 0 ? (
            <List>
              {submissions.map((submission) => (
                <React.Fragment key={submission.id}>
                  <ListItem
                    secondaryAction={
                      <Tooltip title="View Details">
                        <IconButton 
                          edge="end" 
                          onClick={() => handleViewSubmission(submission.id)}
                        >
                          <LaunchIcon />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemText
                      primary={submission.formTitle}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            Submitted: {submission.submittedAt ? formatTimestamp(submission.submittedAt) : 'N/A'}
                          </Typography>
                          <br />
                          <Chip label="Completed" color="success" size="small" sx={{ mt: 1 }} />
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                You haven't submitted any forms yet.
              </Typography>
              <Button 
                variant="contained" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/dashboard')}
              >
                Go to Available Forms
              </Button>
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {drafts.length > 0 ? (
            <List>
              {drafts.map((draft) => (
                <React.Fragment key={draft.id}>
                  <ListItem
                    secondaryAction={
                      <>
                        <Tooltip title="Continue Draft">
                          <IconButton 
                            edge="end" 
                            onClick={() => handleContinueDraft(draft.formId)}
                            sx={{ mr: 1 }}
                          >
                            <LaunchIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Draft">
                          <IconButton 
                            edge="end" 
                            color="error"
                            onClick={() => handleDeleteDraft(draft.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    }
                  >
                    <ListItemText
                      primary={draft.formTitle}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            Last updated: {draft.updatedAt ? formatTimestamp(draft.updatedAt) : 'N/A'}
                          </Typography>
                          <br />
                          <Chip label="Draft" color="primary" size="small" sx={{ mt: 1 }} />
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                You don't have any saved drafts.
              </Typography>
              <Button 
                variant="contained" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/dashboard')}
              >
                Go to Available Forms
              </Button>
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
}

export default UserForms;