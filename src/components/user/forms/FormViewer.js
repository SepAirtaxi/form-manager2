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
  Stepper,
  Step,
  StepLabel,
  FormControl,
  FormControlLabel,
  TextField,
  Checkbox,
  Radio,
  RadioGroup,
  MenuItem,
  Select,
  InputLabel,
  FormGroup,
  FormHelperText
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import { 
  getFormById, 
  submitForm, 
  saveFormDraft, 
  getFormDraft 
} from '../../../services/forms/formService';
import { useAuth } from '../../../contexts/AuthContext';

function FormViewer() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [form, setForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [topLevelSections, setTopLevelSections] = useState([]);
  const [saveStatus, setSaveStatus] = useState(null);
  
  useEffect(() => {
    const loadForm = async () => {
      try {
        const formDoc = await getFormById(formId);
        setForm(formDoc);
        
        // Get top-level sections for navigation
        const sections = formDoc.blocks.filter(block => block.type === 'section' && block.level === 1);
        setTopLevelSections(sections);
        
        // Try to load draft if it exists
        if (currentUser) {
          const draft = await getFormDraft(formId, currentUser.uid);
          if (draft) {
            setFormData(draft.data);
          }
        }
      } catch (error) {
        console.error('Error loading form:', error);
        setError('Failed to load the form. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadForm();
  }, [formId, currentUser]);
  
  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };
  
  const handleSaveDraft = async () => {
    if (!currentUser) {
      setSaveStatus({ error: true, message: 'You must be logged in to save drafts' });
      return;
    }
    
    try {
      setSaving(true);
      await saveFormDraft(formId, formData, currentUser.uid);
      setSaveStatus({ error: false, message: 'Draft saved successfully' });
    } catch (error) {
      console.error('Error saving draft:', error);
      setSaveStatus({ error: true, message: 'Error saving draft' });
    } finally {
      setSaving(false);
      
      // Clear save status after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    }
  };
  
  const handleSubmitForm = async () => {
    if (!currentUser) {
      setSaveStatus({ error: true, message: 'You must be logged in to submit forms' });
      return;
    }
    
    // Validate required fields
    const requiredFields = findRequiredFields(form.blocks);
    const missingFields = requiredFields.filter(fieldId => !formData[fieldId]);
    
    if (missingFields.length > 0) {
      setSaveStatus({ error: true, message: 'Please fill in all required fields before submitting' });
      return;
    }
    
    try {
      setSaving(true);
      await submitForm(formId, formData, currentUser.uid);
      setSaveStatus({ error: false, message: 'Form submitted successfully' });
      
      // Redirect to dashboard after successful submission
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSaveStatus({ error: true, message: 'Error submitting form' });
    } finally {
      setSaving(false);
    }
  };
  
  const handleStepChange = (step) => {
    setActiveStep(step);
  };
  
  // Helper function to find all required fields in the form
  const findRequiredFields = (blocks, requiredFields = []) => {
    blocks.forEach(block => {
      if (block.type === 'field' && block.required) {
        requiredFields.push(block.id);
      }
      
      if (block.children && block.children.length > 0) {
        findRequiredFields(block.children, requiredFields);
      }
    });
    
    return requiredFields;
  };
  
  // Function to check if a section is complete
  const isSectionComplete = (sectionBlocks) => {
    const requiredFieldsInSection = findRequiredFields(sectionBlocks);
    return requiredFieldsInSection.every(fieldId => !!formData[fieldId]);
  };
  
  // Render a form field based on its type
  const renderField = (field) => {
    const value = formData[field.id] || '';
    
    switch (field.fieldType) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={field.title}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            margin="normal"
          />
        );
        
      case 'textarea':
        return (
          <TextField
            fullWidth
            label={field.title}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            multiline
            rows={4}
            margin="normal"
          />
        );
        
      case 'number':
        return (
          <TextField
            fullWidth
            label={field.title}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            margin="normal"
          />
        );
        
      case 'date':
        return (
          <TextField
            fullWidth
            label={field.title}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        );
        
      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              />
            }
            label={field.title + (field.required ? ' *' : '')}
          />
        );
        
      case 'radio':
        return (
          <FormControl component="fieldset" required={field.required} margin="normal">
            <Typography variant="subtitle2">{field.title}{field.required ? ' *' : ''}</Typography>
            <RadioGroup
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            >
              {(field.choices || []).map((choice, index) => (
                <FormControlLabel
                  key={index}
                  value={choice}
                  control={<Radio />}
                  label={choice}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
        
      case 'multiCheckbox':
        return (
          <FormControl component="fieldset" required={field.required} margin="normal">
            <Typography variant="subtitle2">{field.title}{field.required ? ' *' : ''}</Typography>
            <FormGroup>
              {(field.choices || []).map((choice, index) => {
                const selectedValues = Array.isArray(value) ? value : [];
                return (
                  <FormControlLabel
                    key={index}
                    control={
                      <Checkbox
                        checked={selectedValues.includes(choice)}
                        onChange={(e) => {
                          const newValues = [...selectedValues];
                          if (e.target.checked) {
                            if (!newValues.includes(choice)) {
                              newValues.push(choice);
                            }
                          } else {
                            const choiceIndex = newValues.indexOf(choice);
                            if (choiceIndex !== -1) {
                              newValues.splice(choiceIndex, 1);
                            }
                          }
                          handleFieldChange(field.id, newValues);
                        }}
                      />
                    }
                    label={choice}
                  />
                );
              })}
            </FormGroup>
          </FormControl>
        );
        
      case 'dropdown':
        return (
          <FormControl fullWidth margin="normal" required={field.required}>
            <InputLabel>{field.title}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              label={field.title}
            >
              {(field.choices || []).map((choice, index) => (
                <MenuItem key={index} value={choice}>
                  {choice}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
        
      case 'signature':
        return (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {field.title}{field.required ? ' *' : ''}
            </Typography>
            <TextField
              fullWidth
              label="Enter Name to Sign"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              margin="normal"
            />
          </Box>
        );
        
      default:
        return (
          <Typography>Unsupported field type: {field.fieldType}</Typography>
        );
    }
  };
  
  // Recursive function to render blocks for the active section
  const renderFormBlocks = (blocks, path = '') => {
    return blocks.map((block, index) => {
      const currentPath = path ? `${path}.${index + 1}` : `${index + 1}`;
      
      if (block.type === 'section') {
        return (
          <Box key={block.id} sx={{ mb: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                {currentPath} {block.title}
              </Typography>
              
              {block.description && (
                <Typography variant="body2" color="textSecondary" paragraph>
                  {block.description}
                </Typography>
              )}
              
              {block.children && block.children.length > 0 && (
                <Box sx={{ ml: 2, mt: 2 }}>
                  {renderFormBlocks(block.children, currentPath)}
                </Box>
              )}
            </Paper>
          </Box>
        );
      } else if (block.type === 'field') {
        return (
          <Box key={block.id} sx={{ mb: 2 }}>
            {renderField(block)}
          </Box>
        );
      }
      
      return null;
    });
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
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {form.title}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {form.description}
        </Typography>
        
        {saveStatus && (
          <Alert 
            severity={saveStatus.error ? 'error' : 'success'} 
            sx={{ mb: 2 }}
          >
            {saveStatus.message}
          </Alert>
        )}
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {topLevelSections.map((section, index) => {
            const sectionComplete = isSectionComplete([section]);
            
            return (
              <Step key={section.id} completed={sectionComplete}>
                <StepLabel
                  StepIconProps={{
                    icon: sectionComplete ? <CheckCircleIcon color="success" /> : index + 1
                  }}
                  onClick={() => handleStepChange(index)}
                  sx={{ cursor: 'pointer' }}
                >
                  {section.title}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Box>
      
      {topLevelSections.length > 0 && (
        <Box>
          {/* Render only the active top-level section and its children */}
          {renderFormBlocks([topLevelSections[activeStep]])}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0 || saving}
            >
              Previous
            </Button>
            
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<SaveIcon />}
                onClick={handleSaveDraft}
                disabled={saving}
                sx={{ mr: 1 }}
              >
                Save Draft
              </Button>
              
              {activeStep === topLevelSections.length - 1 ? (
                <Button 
                  variant="contained" 
                  startIcon={<SendIcon />}
                  onClick={handleSubmitForm}
                  disabled={saving}
                >
                  Submit Form
                </Button>
              ) : (
                <Button 
                  variant="contained"
                  onClick={() => setActiveStep(Math.min(topLevelSections.length - 1, activeStep + 1))}
                  disabled={saving}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default FormViewer;