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
  IconButton,
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GetAppIcon from '@mui/icons-material/GetApp';
import { getFormById } from '../../../services/forms/formService';
import { generateFormPDF, openPDF, savePDF } from '../../../services/pdf/pdfService';
import { getCompanySettings } from '../../../services/settings/settingsService';

function FormPreview() {
  const { formId } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  useEffect(() => {
    const loadFormAndSettings = async () => {
      try {
        const [formData, settings] = await Promise.all([
          getFormById(formId),
          getCompanySettings()
        ]);
        
        setForm(formData);
        setCompanySettings(settings);
      } catch (error) {
        console.error('Error loading form or settings:', error);
        setError('Failed to load the requested form. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (formId !== 'new') {
      loadFormAndSettings();
    } else {
      setLoading(false);
      setError('Cannot preview a form that has not been saved yet.');
    }
  }, [formId]);
  
  const handleBackToEdit = () => {
    navigate(`/admin/forms/edit/${formId}`);
  };
  
  const handleGeneratePDF = async (downloadFile = false) => {
    if (!form || !companySettings) return;
    
    try {
      setGeneratingPdf(true);
      
      // Generate sample data based on form structure
      const sampleData = generateSampleData(form);
      
      // Generate the PDF
      const pdf = generateFormPDF(form, sampleData, companySettings);
      
      if (downloadFile) {
        // Generate a filename based on form title and date
        const formTitle = form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const date = new Date().toISOString().split('T')[0];
        const filename = `${formTitle}_preview_${date}.pdf`;
        
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
  
  // Generate sample data for preview
  const generateSampleData = (form) => {
    const sampleData = {};
    
    // Helper function to process blocks recursively
    const processBlocks = (blocks) => {
      blocks.forEach(block => {
        if (block.type === 'field') {
          // Generate sample value based on field type
          switch (block.fieldType) {
            case 'text':
              sampleData[block.id] = 'Sample text';
              break;
            case 'textarea':
              sampleData[block.id] = 'This is a sample long text entry that demonstrates how multi-line text will appear in the PDF output.';
              break;
            case 'number':
              sampleData[block.id] = '123';
              break;
            case 'date':
              sampleData[block.id] = new Date().toISOString().split('T')[0];
              break;
            case 'checkbox':
              sampleData[block.id] = Math.random() > 0.5;
              break;
            case 'radio':
              if (block.choices && block.choices.length > 0) {
                sampleData[block.id] = block.choices[0];
              }
              break;
            case 'multiCheckbox':
              if (block.choices && block.choices.length > 0) {
                // Select a random subset of choices
                sampleData[block.id] = block.choices
                  .filter(() => Math.random() > 0.5);
                
                // Ensure at least one choice is selected
                if (sampleData[block.id].length === 0 && block.choices.length > 0) {
                  sampleData[block.id] = [block.choices[0]];
                }
              }
              break;
            case 'dropdown':
              if (block.choices && block.choices.length > 0) {
                sampleData[block.id] = block.choices[0];
              }
              break;
            case 'signature':
              sampleData[block.id] = 'John Doe';
              break;
            default:
              sampleData[block.id] = 'Sample data';
          }
        }
        
        // Process children if any
        if (block.children && block.children.length > 0) {
          processBlocks(block.children);
        }
      });
    };
    
    if (form.blocks && form.blocks.length > 0) {
      processBlocks(form.blocks);
    }
    
    // Add submission metadata for the preview
    sampleData.submittedAt = new Date();
    sampleData.submittedBy = 'Preview User';
    
    return sampleData;
  };
  
  // Helper function to render a block hierarchy
  const renderBlock = (block, level = 0, path = []) => {
    const currentPath = [...path, block.type === 'section' ? 'S' : 'F'];
    const indent = level * 16;
    
    return (
      <Box key={block.id} sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', pl: indent, py: 1, borderLeft: block.type === 'section' ? `4px solid ${level === 0 ? '#0064B2' : level === 1 ? '#4dabf5' : '#90caf9'}` : '4px solid #f5f5f5' }}>
          <Typography variant={block.type === 'section' ? (level === 0 ? 'subtitle1' : 'body1') : 'body2'} 
                     fontWeight={block.type === 'section' ? 'bold' : 'normal'}>
            {currentPath.join('.')} {block.title}
            {block.type === 'field' && ` (${block.fieldType}${block.required ? ', required' : ''})`}
          </Typography>
        </Box>
        
        {block.children && block.children.length > 0 && (
          <Box>
            {block.children.map((child, idx) => renderBlock(child, level + 1, [...currentPath, idx + 1]))}
          </Box>
        )}
      </Box>
    );
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
          Form Preview: {form.title}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToEdit}
            sx={{ mr: 1 }}
          >
            Back to Edit
          </Button>
          
          <Tooltip title="View PDF Preview">
            <Button
              variant="contained"
              color="primary"
              startIcon={generatingPdf ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
              onClick={() => handleGeneratePDF(false)}
              disabled={generatingPdf}
              sx={{ mr: 1 }}
            >
              Preview PDF
            </Button>
          </Tooltip>
          
          <Tooltip title="Download PDF Preview">
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
        <Typography variant="h5" component="h2" gutterBottom>
          {form.title}
        </Typography>
        
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Revision: {form.revision} | Department: {form.department || 'N/A'}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {form.description}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Form Structure
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              This is a simplified preview. Use the PDF button to see a complete rendering with sample data.
            </Alert>
            
            {form.blocks.map((block) => renderBlock(block))}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              PDF Settings
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Header on all pages:</strong> {form.headerOnAllPages ? 'Yes' : 'No (First page only)'}
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>Company name:</strong> {companySettings?.name || 'Not set'}
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>EASA Approval:</strong> {companySettings?.easaNumber || 'Not set'}
              </Typography>
              
              <Typography variant="body2">
                <strong>Company logo:</strong> {companySettings?.logo ? 'Available' : 'Not set'}
              </Typography>
            </Box>
            
            <Typography variant="caption" color="textSecondary">
              Company settings can be modified in the Settings page. These will appear in the PDF header and footer.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default FormPreview;