import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { getFormById } from '../../../services/forms/formService';
import { generateFormPDF, openPDF } from '../../../services/pdf/pdfService';
import { getCompanySettings } from '../../../services/settings/settingsService';

function FormPreview() {
  const { formId } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  
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
  
  const handleGeneratePDF = () => {
    if (!form || !companySettings) return;
    
    const pdf = generateFormPDF(form, {}, companySettings);
    openPDF(pdf);
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
          
          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleGeneratePDF}
          >
            Generate PDF
          </Button>
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
        
        <Typography variant="h6" gutterBottom>
          Form Structure
        </Typography>
        
        {/* This is a placeholder for the actual form preview */}
        {form.blocks.map((block, index) => (
          <Box key={block.id} sx={{ mb: 2 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {index + 1}. {block.title}
              </Typography>
              {block.description && (
                <Typography variant="body2" color="textSecondary">
                  {block.description}
                </Typography>
              )}
              
              {/* Render child blocks in a simplified way for now */}
              {block.children && block.children.length > 0 && (
                <Box sx={{ ml: 4, mt: 2 }}>
                  {block.children.map((child, childIndex) => (
                    <Typography key={child.id} variant="body2">
                      {index + 1}.{childIndex + 1} {child.title}
                    </Typography>
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        ))}
        
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          This is a simplified preview. Use the PDF button to see a complete rendering.
        </Typography>
      </Paper>
    </Box>
  );
}

export default FormPreview;