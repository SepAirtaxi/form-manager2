import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { collection, query, where, getDocs, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
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
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        // Load submissions
        const submissionsQuery = query(
          collection(db, 'submissions'),
          where('userId', '==', currentUser.uid),
          orderBy('submittedAt', 'desc')
        );
        
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissionsList = [];
        
        for (const doc of submissionsSnapshot.docs) {
          const submission = {
            id: doc.id,
            ...doc.data()
          };
          
          // Get the form details
          try {
            const formDoc = await getDoc(collection(db, 'forms'), submission.formId);
            if (formDoc.exists()) {
              submission.formTitle = formDoc.data().title;
              submission.formRevision = formDoc.data().revision;
            } else {
              submission.formTitle = 'Unknown Form';
              submission.formRevision = 'N/A';
            }
          } catch (error) {
            console.error('Error getting form details:', error);
            submission.formTitle = 'Unknown Form';
            submission.formRevision = 'N/A';
          }
          
          submissionsList.push(submission);
        }
        
        setSubmissions(submissionsList);
        
        // Load drafts
        const draftsQuery = query(
          collection(db, 'drafts'),
          where('userId', '==', currentUser.uid),
          orderBy('updatedAt', 'desc')
        );
        
        const draftsSnapshot = await getDocs(draftsQuery);
        const draftsList = [];
        
        for (const doc of draftsSnapshot.docs) {
          const draft = {
            id: doc.id,
            ...doc.data()
          };
          
          // Get the form details
          try {
            const formDoc = await getDoc(collection(db, 'forms'), draft.formId);
            if (formDoc.exists()) {
              draft.formTitle = formDoc.data().title;
              draft.formRevision = formDoc.data().revision;
            } else {
              draft.formTitle = 'Unknown Form';
              draft.formRevision = 'N/A';
            }
          } catch (error) {
            console.error('Error getting form details:', error);
            draft.formTitle = 'Unknown Form';
            draft.formRevision = 'N/A';
          }
          
          draftsList.push(draft);
        }
        
        setDrafts(draftsList);
      } catch (error) {
        console.error('Error loading forms:', error);
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
  
  const handleContinueDraft = (formId) => {
    navigate(`/form/${formId}`);
  };
  
  const handleViewSubmission = (submissionId) => {
    // Not implemented yet - could show a submission details dialog or page
    alert(`View submission ${submissionId} is not implemented yet`);
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
      <Typography variant="h4" component="h1" gutterBottom>
        My Forms
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="form tabs">
          <Tab label="Submitted Forms" />
          <Tab label="Drafts" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        {submissions.length === 0 ? (
          <Typography>You have not submitted any forms yet.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Form</TableCell>
                  <TableCell>Revision</TableCell>
                  <TableCell>Submitted Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{submission.formTitle}</TableCell>
                    <TableCell>{submission.formRevision}</TableCell>
                    <TableCell>
                      {submission.submittedAt ? formatTimestamp(submission.submittedAt) : 'N/A'}
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
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {drafts.length === 0 ? (
          <Typography>You don't have any draft forms.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Form</TableCell>
                  <TableCell>Revision</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drafts.map((draft) => (
                  <TableRow key={draft.id}>
                    <TableCell>{draft.formTitle}</TableCell>
                    <TableCell>{draft.formRevision}</TableCell>
                    <TableCell>
                      {draft.updatedAt ? formatTimestamp(draft.updatedAt) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={() => handleContinueDraft(draft.formId)}
                      >
                        Continue
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>
    </Box>
  );
}

export default UserForms;