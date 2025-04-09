import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Grid,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import { generateFormPDF, openPDF } from '../../../services/pdf/pdfService';
import { formatTimestamp } from '../../../utils/dateUtils';
import { getCompanySettings } from '../../../services/settings/settingsService';

function FormSubmissionViewer() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  
  const [submission, setSubmission] = useState(null);
  const [form, setForm] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  
  useEffect(() => {
    const loadSubmissionData = async () => {
      try {
        // Get the submission document
        const submissionDoc = await getDoc(doc(db, 'submissions', submissionId));
        
        if (!submissionDoc.exists()) {
          throw new Error('Submission not found');
        }
        
        const submissionData = {
          id: submissionDoc.id,
          ...submissionDoc.data()
        };
        
        setSubmission(submissionData);
        
        // Load related form
        const formDoc = await getDoc(doc(db, 'forms', submissionData.formId));
        if (formDoc.exists()) {
          setForm({
            id: formDoc.id,
            ...formDoc.data()
          });
        }
        
        // Load user info
        const userDoc = await getDoc(doc(db, 'users', submissionData.userId));
        if (userDoc.exists()) {
          setUser({
            id: userDoc.id,
            ...userDoc.data()
          });
        }
        
        // Load company settings for PDF generation
        const settings = await getCompanySettings();
        setCompanySettings(settings);
        
      } catch (error) {
        console.error('Error loading submission:', error);
        setError(error.message || 'Error loading submission data');
      } finally {
        setLoading(false);
      }
    };
    
    loadSubmissionData();
  }, [submissionId]);
  
  const handleGeneratePDF = () => {
    if (!form || !submission || !companySettings) return;
    
    const pdf = generateFormPDF(form, submission.data, companySettings);
    openPDF(pdf);
  };
  
  // Helper function to get field title by id
  const getFieldTitle = (fieldId) => {
    // Recursive function to search for field in blocks
    const findField = (blocks) => {
      for (const block of blocks) {
        if (block.type === 'field' && block.id === fieldId) {
          return block.title;
        }
        
        if (block.children && block.children.length > 0) {
          const found = findField(block.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return form && form.blocks ? findField(form.blocks) || fieldId : fieldId;
  };
  
  // Render field value based on its type and value
  const renderFieldValue = (fieldId, value) => {
    if (value === undefined || value === null) {
      return '-';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    return value.toString();
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
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin')}
        >
          Return to Dashboard
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Submission Details
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin')}
            sx={{ mr: 1 }}
          >
            Back to Dashboard
          </Button>
          
          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleGeneratePDF}
          >
            Download PDF
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" gutterBottom>
              {form ? form.title : 'Unknown Form'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Revision: {form ? form.revision : '-'}
            </Typography>
            {form && form.description && (
              <Typography variant="body2" paragraph>
                {form.description}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Submission Information
            </Typography>
            <Typography variant="body2">
              <strong>Submitted by:</strong> {user ? user.name : 'Unknown user'}
            </Typography>
            <Typography variant="body2">
              <strong>Date:</strong> {submission.submittedAt ? formatTimestamp(submission.submittedAt) : 'Unknown'}
            </Typography>
            <Typography variant="body2">
              <strong>Status:</strong> <Chip label="Completed" color="success" size="small" />
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Form Data
        </Typography>
        
        {submission && submission.data && Object.keys(submission.data).length > 0 ? (
          <List>
            {Object.entries(submission.data).map(([fieldId, value]) => (
              <ListItem key={fieldId} divider>
                <ListItemText
                  primary={getFieldTitle(fieldId)}
                  secondary={renderFieldValue(fieldId, value)}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body1" color="textSecondary">
            No form data available.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

export default FormSubmissionViewer;