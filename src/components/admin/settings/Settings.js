import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import {
  getCompanySettings,
  updateCompanySettings,
  getSignatories,
  createSignatory,
  updateSignatory,
  deleteSignatory
} from '../../../services/settings/settingsService';

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

function Settings() {
  const [tabValue, setTabValue] = useState(0);
  const [companySettings, setCompanySettings] = useState({
    name: '',
    address: '',
    contact: '',
    vatNumber: '',
    easaNumber: '',
    logo: null,
    legalText: ''
  });
  const [signatories, setSignatories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [settings, signatoryList] = await Promise.all([
          getCompanySettings(),
          getSignatories()
        ]);
        
        setCompanySettings(settings);
        setSignatories(signatoryList);
      } catch (error) {
        console.error('Error loading settings:', error);
        setSaveStatus({ error: true, message: 'Failed to load settings' });
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleCompanyInputChange = (e) => {
    const { name, value } = e.target;
    setCompanySettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveCompanySettings = async () => {
    try {
      setSaving(true);
      await updateCompanySettings(companySettings);
      setSaveStatus({ error: false, message: 'Company settings saved successfully' });
    } catch (error) {
      console.error('Error saving company settings:', error);
      setSaveStatus({ error: true, message: 'Error saving company settings' });
    } finally {
      setSaving(false);
      
      // Clear save status after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    }
  };
  
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setCompanySettings(prev => ({
        ...prev,
        logo: event.target.result
      }));
    };
    reader.readAsDataURL(file);
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
        Settings
      </Typography>
      
      {saveStatus && (
        <Alert 
          severity={saveStatus.error ? 'error' : 'success'} 
          sx={{ mb: 2 }}
        >
          {saveStatus.message}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
          <Tab label="Company Information" />
          <Tab label="Authorized Signatories" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Company Information
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            These details will be used in PDF headers and footers.
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Name"
                name="name"
                value={companySettings.name}
                onChange={handleCompanyInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Information"
                name="contact"
                value={companySettings.contact}
                onChange={handleCompanyInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={companySettings.address}
                onChange={handleCompanyInputChange}
                multiline
                rows={2}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="VAT/EORI Number"
                name="vatNumber"
                value={companySettings.vatNumber}
                onChange={handleCompanyInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="EASA Approval Number"
                name="easaNumber"
                value={companySettings.easaNumber}
                onChange={handleCompanyInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Legal Text (for PDF footer)"
                name="legalText"
                value={companySettings.legalText}
                onChange={handleCompanyInputChange}
                multiline
                rows={3}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Company Logo
                </Typography>
                
                {companySettings.logo && (
                  <Box sx={{ mb: 2 }}>
                    <img 
                      src={companySettings.logo} 
                      alt="Company Logo" 
                      style={{ maxWidth: '200px', maxHeight: '100px' }} 
                    />
                  </Box>
                )}
                
                <Button
                  variant="outlined"
                  component="label"
                >
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleLogoUpload}
                  />
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveCompanySettings}
              disabled={saving}
            >
              Save Company Settings
            </Button>
          </Box>
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Authorized Signatories
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Manage authorized signatories for form approvals.
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Placeholder for signatories management - we'll implement this later */}
          <Typography>
            Signatory management will be implemented in a future update.
          </Typography>
        </Paper>
      </TabPanel>
    </Box>
  );
}

export default Settings;