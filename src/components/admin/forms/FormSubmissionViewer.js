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
  Grid,
  Chip,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GetAppIcon from '@mui/icons-material/GetApp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import { generateFormPDF, openPDF, savePDF } from '../../../services/pdf/pdfService';
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
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
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
  
  const handleGeneratePDF = async (downloadFile = false) => {
    if (!form || !submission || !companySettings) return;
    
    try {
      setGeneratingPdf(true);
      
      // Prepare submission data for PDF
      const pdfData = {
        ...submission.data,
        submittedAt: submission.submittedAt,
        submittedBy: user ? user.name : 'Unknown User'
      };
      
      const pdf = generateFormPDF(form, pdfData, companySettings);
      
      if (downloadFile) {
        // Generate a filename based on form title and date
        const formTitle = form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const date = new Date().toISOString().split('T')[0];
        const filename = `${formTitle}_${date}.pdf`;
        
        savePDF(pdf, filename);
      } else {
        openPDF(pdf);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please check console for details.');
    } finally {
      setGeneratingPdf(false);
    }
  };
  
  // Helper function to get field information by id
  const getFieldInfo = (fieldId) => {
    // Recursive function to search for field in blocks
    const findField = (blocks, path = '') => {
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const currentPath = path ? `${path}.${i + 1}` : `${i + 1}`;
        
        if (block.type === 'field' && block.id === fieldId) {
          return {
            title: block.title,
            fieldType: block.fieldType,
            description: block.description,
            required: block.required,
            path: currentPath
          };
        }
        
        if (block.children && block.children.length > 0) {
          const found = findField(block.children, currentPath);
          if (found) return found;
        }
      }
      return null;
    };
    
    return form && form.blocks ? findField(form.blocks) : { title: fieldId, path: '' };
  };
  
  // Helper function to get a section's info by ID
  const getSectionInfo = (sectionId) => {
    const findSection = (blocks, path = '') => {
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const currentPath = path ? `${path}.${i + 1}` : `${i + 1}`;
        
        if (block.type === 'section' && block.id === sectionId) {
          return {
            title: block.title,
            description: block.description,
            level: block.level,
            path: currentPath
          };
        }
        
        if (block.children && block.children.length > 0) {
          const found = findSection(block.children, currentPath);
          if (found) return found;
        }
      }
      return null;
    };
    
    return form && form.blocks ? findSection(form.blocks) : null;
  };
  
  // Render field value based on its type and value
  const renderFieldValue = (fieldId, value) => {
    if (value === undefined || value === null) {
      return '-';
    }
    
    const fieldInfo = getFieldInfo(fieldId);
    const fieldType = fieldInfo?.fieldType;
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    // If it's a date field, try to format it nicely
    if (fieldType === 'date') {
      try {
        const date = new Date(value);
        if (!isNaN(date)) {
          return date.toLocaleDateString();
        }
      } catch (e) {
        // Fall back to raw value
      }
    }
    
    return value.toString();
  };
  
  // Organize form data by sections
  const organizeFormDataBySections = () => {
    if (!form || !submission || !submission.data) return [];
    
    const sectionMap = new Map();
    
    // First, create a map of all sections
    const processSections = (blocks, parentSection = null) => {
      blocks.forEach(block => {
        if (block.type === 'section') {
          const sectionInfo = {
            id: block.id,
            title: block.title,
            description: block.description,
            level: block.level,
            parentSection: parentSection,
            fields: []
          };
          
          sectionMap.set(block.id, sectionInfo);
          
          if (block.children && block.children.length > 0) {
            processSections(block.children, block.id);
          }
        }
      });
    };
    
    // Process all fields and assign them to sections
    const mapFieldsToSections = (blocks, currentSection = null) => {
      blocks.forEach(block => {
        if (block.type === 'section') {
          const sectionId = block.id;
          
          if (block.children && block.children.length > 0) {
            mapFieldsToSections(block.children, sectionId);
          }
        } else if (block.type === 'field') {
          const fieldId = block.id;
          
          // Check if there's data for this field
          if (submission.data[fieldId] !== undefined) {
            const fieldInfo = getFieldInfo(fieldId);
            const fieldValue = renderFieldValue(fieldId, submission.data[fieldId]);
            
            const fieldData = {
              id: fieldId,
              title: fieldInfo.title,
              value: fieldValue,
              fieldType: fieldInfo.fieldType,
              required: fieldInfo.required,
              path: fieldInfo.path
            };
            
            // Add to current section
            if (currentSection && sectionMap.has(currentSection)) {
              sectionMap.get(currentSection).fields.push(fieldData);
            }
          }
        }
      });
    };
    
    // Build the section hierarchy
    processSections(form.blocks);
    mapFieldsToSections(form.blocks);
    
    // Convert map to array and sort sections by level and path
    const sections = Array.from(sectionMap.values())
      .filter(section => section.fields.length > 0);
    
    return sections;
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
  
  const formDataBySections = organizeFormDataBySections();
  
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
          
          <Tooltip title="View PDF">
            <Button
              variant="contained"
              color="primary"
              startIcon={generatingPdf ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
              onClick={() => handleGeneratePDF(false)}
              disabled={generatingPdf}
              sx={{ mr: 1 }}
            >
              View PDF
            </Button>
          </Tooltip>
          
          <Tooltip title="Download PDF">
            <IconButton
              color="primary"
              onClick={() => handleGeneratePDF(true)}
              disabled={generatingPdf}
            >
              <GetAppIcon />
            </IconButton>
          </Tooltip>
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
        
        {formDataBySections.length > 0 ? (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Form data is organized by sections. Click on a section to view its contents.
            </Alert>
            
            {formDataBySections.map((section) => {
              const sectionInfo = getSectionInfo(section.id);
              const level = section.level;
              const indent = (level - 1) * 16;
              
              return (
                <Accordion key={section.id} sx={{ mb: 1 }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      borderLeft: `4px solid ${level === 1 ? '#0064B2' : level === 2 ? '#4dabf5' : '#90caf9'}`,
                      backgroundColor: '#f5f9ff'
                    }}
                  >
                    <Box sx={{ pl: indent }}>
                      <Typography variant={level === 1 ? "subtitle1" : "body1"} fontWeight="bold">
                        {sectionInfo?.path} {section.title}
                      </Typography>
                      {section.description && (
                        <Typography variant="body2" color="textSecondary">
                          {section.description}
                        </Typography>
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell width="30%">Field</TableCell>
                            <TableCell width="70%">Value</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {section.fields.map((field) => (
                            <TableRow key={field.id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {field.path} {field.title}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {field.fieldType} {field.required ? '(required)' : ''}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography>
                                  {field.value}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        ) : (
          <Typography variant="body1" color="textSecondary">
            No form data available.
          </Typography>
        )}
        
        {/* Flat view for all fields */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            All Fields (Flat View)
          </Typography>
          
                      <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="30%">Field</TableCell>
                    <TableCell width="70%">Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submission && submission.data && Object.entries(submission.data).map(([fieldId, value]) => {
                    const fieldInfo = getFieldInfo(fieldId);
                    return (
                      <TableRow key={fieldId}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {fieldInfo.path} {fieldInfo.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {fieldInfo.fieldType || 'unknown'} {fieldInfo.required ? '(required)' : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>
                            {renderFieldValue(fieldId, value)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {(!submission || !submission.data || Object.keys(submission.data).length === 0) && (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        No form data available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>
      </Box>
    );
}

export default FormSubmissionViewer;