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
  FormHelperText,
  Stack,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Container,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  InputAdornment
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MenuIcon from '@mui/icons-material/Menu';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import ListIcon from '@mui/icons-material/List';
import { useAuth } from '../../../contexts/AuthContext';
import { getFormById, submitForm, saveFormDraft, getFormDraft } from '../../../services/forms/formService';

function FormViewer() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [activeSection, setActiveSection] = useState(0);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [sectionValidation, setSectionValidation] = useState({});
  const [progress, setProgress] = useState(0);
  
  // Extract top-level sections to use as navigation items
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
  
  // Update section validation status and progress whenever formData changes
  useEffect(() => {
    if (!form) return;
    
    const newSectionValidation = {};
    let completedSections = 0;
    
    // Check each section for completeness
    topLevelSections.forEach((section, index) => {
      const sectionErrors = validateSection(section);
      const isValid = Object.keys(sectionErrors).length === 0;
      
      // Check if any fields in this section have been filled
      const sectionFields = getAllFieldsInSection(section);
      const hasData = sectionFields.some(fieldId => {
        const value = formData[fieldId];
        return value !== undefined && value !== '' && value !== null;
      });
      
      // A section is complete if it's valid and has at least some data
      const isComplete = isValid && hasData && sectionFields.length > 0;
      
      newSectionValidation[section.id] = {
        isValid,
        isComplete,
        hasData
      };
      
      if (isComplete) {
        completedSections++;
      }
    });
    
    setSectionValidation(newSectionValidation);
    
    // Calculate overall progress
    const totalSections = topLevelSections.length;
    const newProgress = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
    setProgress(newProgress);
  }, [formData, form, topLevelSections]);
  
  // Helper function to get all field IDs in a section
  const getAllFieldsInSection = (section) => {
    const fields = [];
    
    const traverse = (block) => {
      if (block.type === 'field') {
        fields.push(block.id);
      }
      
      if (block.children && block.children.length > 0) {
        block.children.forEach(traverse);
      }
    };
    
    traverse(section);
    return fields;
  };
  
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
  
  const handleSectionChange = (index) => {
    setActiveSection(index);
    closeNavDrawer();
    window.scrollTo(0, 0);
  };
  
  const handleNext = () => {
    // Move to the next section if not at the end
    if (activeSection < topLevelSections.length - 1) {
      setActiveSection(activeSection + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleBack = () => {
    // Move to the previous section if not at the beginning
    if (activeSection > 0) {
      setActiveSection(activeSection - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const openNavDrawer = () => {
    setNavDrawerOpen(true);
  };
  
  const closeNavDrawer = () => {
    setNavDrawerOpen(false);
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
          setActiveSection(i);
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
  const renderField = (field, path) => {
    const fieldId = field.id;
    const value = formData[fieldId] !== undefined ? formData[fieldId] : '';
    const error = validationErrors[fieldId];
    
    // The field label with path prefix
    const fieldLabel = `${path} ${field.title}`;
    
    switch (field.fieldType) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={fieldLabel}
            value={value}
            onChange={(e) => handleInputChange(fieldId, e.target.value)}
            margin="dense"
            error={!!error}
            helperText={error}
            required={field.required}
            size={isMobile ? "small" : "medium"}
          />
        );
      
      case 'textarea':
        return (
          <TextField
            fullWidth
            label={fieldLabel}
            value={value}
            onChange={(e) => handleInputChange(fieldId, e.target.value)}
            multiline
            rows={isMobile ? 3 : 4}
            margin="dense"
            error={!!error}
            helperText={error}
            required={field.required}
            size={isMobile ? "small" : "medium"}
          />
        );
      
      case 'number':
        return (
          <TextField
            fullWidth
            label={fieldLabel}
            type="number"
            value={value}
            onChange={(e) => handleInputChange(fieldId, e.target.value)}
            margin="dense"
            error={!!error}
            helperText={error}
            required={field.required}
            InputProps={{ inputProps: { min: 0 } }}
            size={isMobile ? "small" : "medium"}
          />
        );
      
      case 'date':
        return (
          <TextField
            fullWidth
            label={fieldLabel}
            type="date"
            value={value}
            onChange={(e) => handleInputChange(fieldId, e.target.value)}
            margin="dense"
            InputLabelProps={{
              shrink: true,
            }}
            error={!!error}
            helperText={error}
            required={field.required}
            size={isMobile ? "small" : "medium"}
          />
        );
      
      case 'checkbox':
        return (
          <FormControl 
            component="fieldset" 
            margin="dense"
            error={!!error}
            required={field.required}
            fullWidth
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!value}
                  onChange={(e) => handleInputChange(fieldId, e.target.checked)}
                  size={isMobile ? "small" : "medium"}
                />
              }
              label={fieldLabel}
            />
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );
      
      case 'radio':
        return (
          <FormControl 
            component="fieldset" 
            margin="dense"
            error={!!error}
            required={field.required}
            fullWidth
          >
            <FormLabel component="legend">{fieldLabel}</FormLabel>
            <RadioGroup
              value={value}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              row={isMobile && field.choices && field.choices.length <= 3}
            >
              {(field.choices || []).map((choice, index) => (
                <FormControlLabel
                  key={index}
                  value={choice}
                  control={<Radio size={isMobile ? "small" : "medium"} />}
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
            margin="dense"
            error={!!error}
            required={field.required}
            fullWidth
          >
            <FormLabel component="legend">{fieldLabel}</FormLabel>
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap' }}>
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
                      size={isMobile ? "small" : "medium"}
                    />
                  }
                  label={choice}
                  sx={{ width: isMobile ? '100%' : 'auto', mr: 2 }}
                />
              ))}
            </Box>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );
      
      case 'dropdown':
        return (
          <FormControl 
            fullWidth 
            margin="dense"
            error={!!error}
            required={field.required}
            size={isMobile ? "small" : "medium"}
          >
            <FormLabel component="legend">{fieldLabel}</FormLabel>
            <Select
              value={value}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              displayEmpty
              sx={{ mt: 1 }}
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
            label={fieldLabel}
            value={value}
            onChange={(e) => handleInputChange(fieldId, e.target.value)}
            margin="dense"
            placeholder="Type your name to sign"
            error={!!error}
            helperText={error || "Type your name to sign"}
            required={field.required}
            size={isMobile ? "small" : "medium"}
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
  const renderBlocks = (blocks, path = '', level = 1) => {
    return blocks.map((block, index) => {
      const currentPath = path ? `${path}.${index + 1}` : `${index + 1}`;
      
      if (block.type === 'section') {
        // For level 2 and 3 sections, render them with appropriate styling
        if (block.level > 1) {
          return (
            <Box key={block.id} sx={{ mb: 2 }}>
              {/* Section Header */}
              <Paper
                sx={{
                  p: isMobile ? 1.5 : 2,
                  mb: 1,
                  borderLeft: `4px solid ${block.level === 2 ? '#0064B2' : '#4dabf5'}`,
                  backgroundColor: '#f5f9ff',
                }}
              >
                <Typography
                  variant={isMobile ? "subtitle1" : (block.level === 2 ? "h6" : "subtitle1")}
                  gutterBottom={!!block.description}
                  sx={{
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {currentPath} {block.title}
                </Typography>
                
                {block.description && (
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mt: 0.5 }}
                  >
                    {block.description}
                  </Typography>
                )}
              </Paper>
              
              {/* Section Content */}
              <Box sx={{ pl: isMobile ? 1 : 2 }}>
                {block.children && block.children.length > 0 &&
                  renderBlocks(block.children, currentPath, block.level + 1)}
              </Box>
            </Box>
          );
        }
        
        // Level 1 sections are handled by navigation, so we just render their children
        return (
          <React.Fragment key={block.id}>
            {block.children && block.children.length > 0 &&
              renderBlocks(block.children, currentPath, block.level + 1)}
          </React.Fragment>
        );
      } else if (block.type === 'field') {
        return (
          <Box key={block.id} sx={{ mb: 1.5 }}>
            {renderField(block, currentPath)}
          </Box>
        );
      }
      
      return null;
    });
  };
  
  // Navigation Drawer for section selection
  const renderNavigationDrawer = () => {
    return (
      <Drawer
        anchor="right"
        open={navDrawerOpen}
        onClose={closeNavDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '80%' : 320,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Form Sections
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {topLevelSections.map((section, index) => {
              const validation = sectionValidation[section.id] || {};
              return (
                <ListItem
                  key={section.id}
                  button
                  selected={activeSection === index}
                  onClick={() => handleSectionChange(index)}
                >
                  <ListItemIcon>
                    {validation.isComplete ? (
                      <CheckCircleIcon color="success" />
                    ) : validation.hasData && !validation.isValid ? (
                      <ErrorIcon color="error" />
                    ) : (
                      <NavigateNextIcon />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${index + 1}. ${section.title}`}
                    secondary={
                      validation.isComplete
                        ? "Completed"
                        : validation.hasData
                        ? validation.isValid
                          ? "In progress"
                          : "Has errors"
                        : "Not started"
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
    );
  };
  
  // Section selector dropdown for mobile
  const renderSectionDropdown = () => {
    return (
      <FormControl fullWidth size={isMobile ? "small" : "medium"} sx={{ mb: 2 }}>
        <Select
          value={activeSection}
          onChange={(e) => handleSectionChange(e.target.value)}
          displayEmpty
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            '.MuiSelect-select': {
              display: 'flex', 
              alignItems: 'center'
            }
          }}
          startAdornment={
            <InputAdornment position="start">
              <ListIcon />
            </InputAdornment>
          }
        >
          {topLevelSections.map((section, index) => {
            const validation = sectionValidation[section.id] || {};
            return (
              <MenuItem key={section.id} value={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography sx={{ flex: 1 }}>
                    {index + 1}. {section.title}
                  </Typography>
                  {validation.isComplete && (
                    <CheckCircleIcon color="success" fontSize="small" sx={{ ml: 1 }} />
                  )}
                  {!validation.isValid && validation.hasData && (
                    <ErrorIcon color="error" fontSize="small" sx={{ ml: 1 }} />
                  )}
                </Box>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
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
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </Button>
      </Box>
    );
  }
  
  // Current section being displayed
  const currentSection = topLevelSections[activeSection];
  
  return (
    <Container maxWidth={isMobile ? "sm" : "md"} sx={{ pb: 10 }}>
      {/* Form Header */}
      <Box sx={{ mb: 2 }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h1" 
          gutterBottom
          sx={{ fontSize: isMobile ? '1.5rem' : undefined }}
        >
          {form.title}
        </Typography>
        
        {form.description && (
          <Typography 
            variant="body1" 
            paragraph
            sx={{ fontSize: isMobile ? '0.9rem' : undefined }}
          >
            {form.description}
          </Typography>
        )}
        
        {/* Form metadata and progress */}
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', mb: 1, gap: 1 }}>
          {form.department && (
            <Chip 
              label={`Department: ${form.department}`} 
              size="small" 
              sx={{ mr: 1 }}
            />
          )}
          <Chip 
            label={`Revision: ${form.revision}`} 
            size="small" 
            variant="outlined"
          />
          <Box sx={{ flexGrow: 1 }} />
          <Chip 
            icon={<CheckCircleIcon />}
            label={`${Math.round(progress)}% complete`} 
            color="primary" 
            variant="outlined" 
            size="small"
          />
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 6, borderRadius: 3, mb: 1 }}
        />
      </Box>
      
      {saveStatus && (
        <Alert 
          severity={saveStatus.includes('Error') ? 'error' : 'success'} 
          sx={{ mb: 2 }}
        >
          {saveStatus}
        </Alert>
      )}
      
      {/* Section Navigation */}
      {renderSectionDropdown()}
      
      {/* Main Form Content */}
      <Paper 
        sx={{ 
          p: isMobile ? 2 : 3, 
          mb: 3, 
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
      >
        {/* Current Section Header */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            component="h2" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              color: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              pb: 1,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            {activeSection + 1}. {currentSection?.title}
          </Typography>
          
          {currentSection?.description && (
            <Typography 
              variant="body1" 
              color="textSecondary" 
              sx={{ mt: 1 }}
            >
              {currentSection.description}
            </Typography>
          )}
        </Box>
        
        {/* Current Section Fields */}
        {currentSection && renderBlocks([currentSection])}
        
        {/* Navigation buttons */}
        <Box sx={{ 
          mt: 4, 
          display: 'flex', 
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            disabled={activeSection === 0 || saving}
            fullWidth={isMobile}
            size={isMobile ? "medium" : "large"}
          >
            Previous
          </Button>
          
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2,
              flexDirection: isMobile ? 'column' : 'row',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSaveAsDraft}
              disabled={saving}
              fullWidth={isMobile}
              size={isMobile ? "medium" : "large"}
            >
              Save Draft
            </Button>
            
            {activeSection === topLevelSections.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                endIcon={<SendIcon />}
                onClick={handleSubmitForm}
                disabled={saving}
                fullWidth={isMobile}
                size={isMobile ? "medium" : "large"}
              >
                Submit
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                onClick={handleNext}
                disabled={saving}
                fullWidth={isMobile}
                size={isMobile ? "medium" : "large"}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      
      {/* Fixed bottom navigation for mobile */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            p: 1.5,
            borderRadius: 0,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Button
            variant="text"
            color="primary"
            disabled={activeSection === 0}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            size="small"
          >
            Back
          </Button>
          
          <Button
            variant="outlined"
            color="primary"
            onClick={openNavDrawer}
            startIcon={<MenuIcon />}
            size="small"
          >
            Sections
          </Button>
          
          <Button
            variant="text"
            color="primary"
            disabled={activeSection === topLevelSections.length - 1}
            onClick={handleNext}
            endIcon={<ArrowForwardIcon />}
            size="small"
          >
            Next
          </Button>
        </Paper>
      )}
      
      {/* Navigation Drawer */}
      {renderNavigationDrawer()}
    </Container>
  );
}

export default FormViewer;