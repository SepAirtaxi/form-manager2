import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  CircularProgress,
  Divider,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import PreviewIcon from '@mui/icons-material/Preview';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getFormById, createForm, updateForm, publishForm } from '../../../services/forms/formService';
import FormBlockEditor from './FormBlockEditor'; // We'll create this next

function FormEditor() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const isNewForm = !formId;
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    department: '',
    revision: '1.0',
    published: false,
    blocks: [{
      id: 'section1',
      type: 'section',
      title: 'Section 1',
      description: '',
      level: 1,
      children: []
    }],
    headerOnAllPages: true
  });
  
  const [loading, setLoading] = useState(!isNewForm);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  
  useEffect(() => {
    const loadForm = async () => {
      if (isNewForm) return;
      
      try {
        const formData = await getFormById(formId);
        setForm(formData);
      } catch (error) {
        console.error('Error loading form:', error);
        setError('Failed to load form. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadForm();
  }, [formId, isNewForm]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleSaveForm = async () => {
    try {
      setSaving(true);
      
      if (isNewForm) {
        const newFormId = await createForm(form);
        setSaveStatus('Form created successfully');
        
        // Redirect to edit the new form
        navigate(`/admin/forms/edit/${newFormId}`, { replace: true });
      } else {
        await updateForm(formId, form);
        setSaveStatus('Form saved successfully');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      setSaveStatus('Error saving form');
    } finally {
      setSaving(false);
      
      // Clear save status after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    }
  };
  
  const handlePublishForm = async () => {
    try {
      setSaving(true);
      
      // Save first, then publish
      if (isNewForm) {
        const newFormId = await createForm({
          ...form,
          published: true
        });
        setSaveStatus('Form published successfully');
        
        // Redirect to edit the new form
        navigate(`/admin/forms/edit/${newFormId}`, { replace: true });
      } else {
        await updateForm(formId, {
          ...form,
          published: true
        });
        setForm(prev => ({
          ...prev,
          published: true
        }));
        setSaveStatus('Form published successfully');
      }
    } catch (error) {
      console.error('Error publishing form:', error);
      setSaveStatus('Error publishing form');
    } finally {
      setSaving(false);
      
      // Clear save status after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    }
  };
  
  const handlePreviewForm = () => {
    // Save form first, then navigate to preview
    handleSaveForm().then(() => {
      navigate(`/admin/forms/preview/${formId || 'new'}`);
    });
  };
  
  const handleDeleteForm = () => {
    // Implement delete confirmation dialog later
    if (window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      // Implement delete logic
      navigate('/admin');
    }
  };
  
  const updateBlocks = (newBlocks) => {
    setForm(prev => ({
      ...prev,
      blocks: newBlocks
    }));
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
          {isNewForm ? 'Create New Form' : 'Edit Form'}
        </Typography>
        <Box>
          <Tooltip title="Save">
            <IconButton 
              color="primary" 
              onClick={handleSaveForm}
              disabled={saving}
              sx={{ mr: 1 }}
            >
              <SaveIcon />
            </IconButton>
          </Tooltip>
          
          {!isNewForm && (
            <>
              <Tooltip title="Preview">
                <IconButton 
                  color="primary" 
                  onClick={handlePreviewForm}
                  disabled={saving}
                  sx={{ mr: 1 }}
                >
                  <PreviewIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Delete">
                <IconButton 
                  color="error" 
                  onClick={handleDeleteForm}
                  disabled={saving}
                  sx={{ mr: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<PublishIcon />}
            onClick={handlePublishForm}
            disabled={saving || form.published}
          >
            {form.published ? 'Published' : 'Publish'}
          </Button>
        </Box>
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
        <Typography variant="h6" component="h2" gutterBottom>
          Form Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Form Title"
              name="title"
              value={form.title}
              onChange={handleInputChange}
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Department"
              name="department"
              value={form.department}
              onChange={handleInputChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={form.description}
              onChange={handleInputChange}
              multiline
              rows={2}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Revision"
              name="revision"
              value={form.revision}
              onChange={handleInputChange}
              margin="normal"
              disabled
              helperText="Revision is updated automatically when publishing"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  name="headerOnAllPages"
                  checked={form.headerOnAllPages}
                  onChange={handleSwitchChange}
                />
              }
              label="Show header on all pages (PDF output)"
              sx={{ mt: 2 }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Form Structure
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Build your form by adding sections and fields. Sections can be nested up to 3 levels deep.
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <FormBlockEditor 
          blocks={form.blocks} 
          updateBlocks={updateBlocks} 
        />
      </Paper>
    </Box>
  );
}

export default FormEditor;