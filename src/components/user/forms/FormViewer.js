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
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  MenuItem,
  Select,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormHelperText
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../../../contexts/AuthContext';
import { getFormById, submitForm, saveFormDraft, getFormDraft } from '../../../services/forms/formService';

function FormViewer() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Extract top-level sections to use as steps
  const topLevelSections = form?.blocks.filter(block => 
    block.type === 'section' && block.level === 1
  ) || [];
  
  useEffect(() => {
    const loadFormAndDrafts = async () => {
      try {
        const [formData, draftData] = await Promise.all([
          getFormById(formId),
          getFormDraft(formId, currentUser.uid).catch(() => null)
        ]);
        
        setForm(formData);
        
        // If there's a draft, load its data
        if (draftData && draftData.data) {
          setFormData(draftData.data);
          setSaveStatus('Draft loaded');
          
          // Clear save status after 3 seconds
          setTimeout(() => {
            setSaveStatus(null);
          }, 3000);
        }
      } catch (error) {
        console.error('Error loading form:', error);
        setError('Failed to load the form. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      loadFormAndDrafts();
    }
  }, [formId, currentUser]);
  
  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear validation error for this field if it exists
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };
  
  const handleNext = () => {
    // Validate required fields in current section
    const currentSection = topLevelSections[activeStep];
    const errors = validateSection(currentSection);
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...errors }));
      return;
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    window.scrollTo(0, 0);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    window.scrollTo(0, 0);
  };
  
  const validateSection = (section) => {
    const errors = {};
    
    // Helper function to check required fields recursively
    const checkRequiredFields = (blocks) => {
      blocks.forEach(block => {
        if (block.type === 'field' && block.required) {
          const value = formData[block.id];
          
          // Check if the field is empty
          const isEmpty = 
            value === undefined || 
            value === null || 
            value === '' || 
            (Array.isArray(value) && value.length === 0);
          
          if (isEmpty) {
            errors[block.id] = 'This field is required';
          }
        }
        
        // Check children if they exist
        if (block.children && block.children.length > 0) {
          checkRequiredFields(block.children);
        }
      });
    };
    
    // Start validation from the current section
    if (section.children && section.children.length > 0) {
      checkRequiredFields([section]);
    }
    
    return errors;
  };
  
  const validateForm = () => {
    const errors = {};
    
    // Check all blocks recursively
    const checkAllBlocks = (blocks) => {
      blocks.forEach(block => {
        if (block.type === 'field' && block.required) {
          const value = formData[block.id];
          
          // Check if the field is empty
          const isEmpty = 
            value === undefined || 
            value === null || 
            value === '' || 
            (Array.isArray(value) && value.length === 0);
          
          if (isEmpty) {
            errors[block.id] = 'This field is required';
          }
        }
        
        // Check children if they exist
        if (block.children && block.children.length > 0) {
          checkAllBlocks(block.children);
        }
      });
    };
    
    checkAllBlocks(form.blocks);
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSaveAsDraft = async () => {
    try {
      setSaving(true);
      await saveFormDraft(formId, formData, currentUser.uid);
      setSaveStatus('Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      setSaveStatus('Error saving draft');
    } finally {
      setSaving(false);
      
      // Clear save status after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    }
  };
  
  const handleSubmitForm = async () => {
    // Validate the entire form
    if (!validateForm()) {
      // If there are validation errors, show an alert and switch to the first section with errors
      setSaveStatus('Please fix the errors before submitting');
      
      // Find the first section with errors and navigate to it
      for (let i = 0; i < topLevelSections.length; i++) {
        const section = topLevelSections[i];
        const errors = validateSection(section);
        
        if (Object.keys(errors).length > 0) {
          setActiveStep(i);
          break;
        }
      }
      
      // Clear save status after 5 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 5000);
      
      return;
    }
    
    try {
      setSaving(true);
      await submitForm(formId, formData, currentUser.uid);
      setSaveStatus('Form submitted successfully');
      
      // Navigate to my forms page after successful submission
      setTimeout(() => {
        navigate('/forms');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSaveStatus('Error submitting form');
      setSaving(false);
    }
  };
  
  // Render a field based on its type
  const renderField = (field) => {
    const fieldId = field.id;
    const value = formData[fieldId] !== undefined ? formData[fieldId] : '';
    const error = validationErrors[fieldId];
    
    switch (field.fieldType) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={field.title}
            value={value}
            onChange={(e) => handleInputChange(fieldId, e.target.value)}
            margin="normal"
            error={!!error}
            helperText={error}
            required={field.required}
          />
        );
      
      case 'textarea':
        return (
          <TextField
            fullWidth
            label={field.title}
            value={value}
            onChange={(e) => handleInputChange(fieldId, e.target.value)}
            multiline
            rows={4}
            margin="normal"
            error={!!error}
            helperText={error}
            required={field.required}
          />
        );
      
      case 'number':
        return (
          <TextField
            fullWidth
            label={field.title}
            type="number"
            value={value}
            onChange={(e) => handleInputChange(fieldId, e.target.value)}
            margin="normal"
            error={!!error}
            helperText={error}
            required={field.required}
          />
        );
      
      case 'date':
        return (
          <TextField
            fullWidth
            label={field.title}
            type="date"
            value={value}
            onChange={(e) => handleInputChange(fieldId, e.target.value)}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
            error={!!error}
            helperText={error}
            required={field.required}
          />
        );
      
      case 'checkbox':
        return (
          <FormControl 
            component="fieldset" 
            margin="normal"
            error={!!error}
            required={field.required}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!value}
                  onChange={(e) => handleInputChange(fieldId, e.target.checked)}
                />
              }
              label={field.title}
            />
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );
      
      case 'radio':
        return (
          <FormControl 
            component="fieldset" 
            margin="normal"
            error={!!error}
            required={field.required}
          >
            <FormLabel component="legend">{field.title}</FormLabel>
            <RadioGroup
              value={value}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
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
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );
      
      case 'multiCheckbox':
        return (
          <FormControl 
            component="fieldset" 
            margin="normal"
            error={!!error}
            required={field.required}
          >
            <FormLabel component="legend">{field.title}</FormLabel>
            {(field.choices || []).map((choice, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={Array.isArray(value) ? value.includes(choice) : false}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? [...value] : [];
                      if (e.target.checked) {
                        currentValues.push(choice);
                      } else {
                        const index = currentValues.indexOf(choice);
                        if (index !== -1) {
                          currentValues.splice(index, 1);
                        }
                      }
                      handleInputChange(fieldId, currentValues);
                    }}
                  />
                }
                label={choice}
              />
            ))}
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );
      
      case 'dropdown':
        return (
          <FormControl 
            fullWidth 
            margin="normal"
            error={!!error}
            required={field.required}
          >
            <FormLabel component="legend">{field.title}</FormLabel>
            <Select
              value={value}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              displayEmpty
            >
              <MenuItem value="" disabled>
                Select an option
              </MenuItem>
              {(field.choices || []).map((choice, index) => (
                <MenuItem key={index} value={choice}>
                  {choice}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );
      
      case 'signature':
        // For now, we'll use a text field as a placeholder for signature
        return (
          <TextField
            fullWidth
            label={field.title}
            value={value}
            onChange={(e) => handleInputChange(fieldId, e.target.value)}
            margin="normal"
            placeholder="Type your name to sign"
            error={!!error}
            helperText={error || "Type your name to sign (actual signature capture will be implemented later)"}
            required={field.required}
          />
        );
      
      default:
        return (
          <Typography color="error">
            Unknown field type: {field.fieldType}
          </Typography>
        );
    }
  };
  
  // Recursively render form blocks
  const renderBlocks = (blocks, path = '') => {
    return blocks.map((block, index) => {
      const currentPath = path ? `${path}.${index + 1}` : `${index + 1}`;
      
      if (block.type === 'section') {
        return (
          <Box key={block.id} sx={{ mb: 3 }}>
            <Typography 
              variant={block.level === 1 ? "h5" : block.level === 2 ? "h6" : "subtitle1"}
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                color: block.level === 1 ? 'primary.main' : 'text.primary'
              }}
            >
              {currentPath} {block.title}
            </Typography>
            
            {block.description && (
              <Typography 
                variant="body2" 
                color="textSecondary" 
                paragraph
                sx={{ mb: 2 }}
              >
                {block.description}
              </Typography>
            )}
            
            {/* Render children with proper indentation */}
            <Box sx={{ ml: block.level > 1 ? 3 : 0 }}>
              {block.children && block.children.length > 0 && 
                renderBlocks(block.children, currentPath)}
            </Box>
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
        
        {form.description && (
          <Typography variant="body1" paragraph>
            {form.description}
          </Typography>
        )}
        
        {form.department && (
          <Typography variant="body2" color="textSecondary">
            Department: {form.department}
          </Typography>
        )}
      </Box>
      
      {saveStatus && (
        <Alert 
          severity={saveStatus.includes('Error') ? 'error' : 'success'} 
          sx={{ mb: 2 }}
        >
          {saveStatus}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {topLevelSections.map((section, index) => (
            <Step key={section.id}>
              <StepLabel>{section.title}</StepLabel>
              <StepContent>
                {renderBlocks([section])}
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      disabled={index === 0 || saving}
                      onClick={handleBack}
                      startIcon={<ArrowBackIcon />}
                    >
                      Back
                    </Button>
                    
                    <Box>
                      <Button
                        onClick={handleSaveAsDraft}
                        disabled={saving}
                        startIcon={<SaveIcon />}
                        sx={{ mr: 1 }}
                      >
                        Save Draft
                      </Button>
                      
                      {index === topLevelSections.length - 1 ? (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleSubmitForm}
                          disabled={saving}
                          startIcon={<SendIcon />}
                        >
                          Submit
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          endIcon={<ArrowForwardIcon />}
                        >
                          Continue
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
        
        {/* Show form completion message */}
        {activeStep === topLevelSections.length && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              All sections completed!
            </Typography>
            <Typography paragraph>
              You have completed all sections of the form. Please review your answers before submitting.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                onClick={() => setActiveStep(topLevelSections.length - 1)}
                sx={{ mr: 1 }}
              >
                Back to Last Section
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitForm}
                disabled={saving}
                startIcon={<SendIcon />}
              >
                Submit Form
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default FormViewer;