import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { v4 as uuidv4 } from 'uuid';

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text Field' },
  { value: 'textarea', label: 'Long Text Area' },
  { value: 'number', label: 'Number Field' },
  { value: 'date', label: 'Date Picker' },
  { value: 'checkbox', label: 'Checkbox (Yes/No)' },
  { value: 'radio', label: 'Single Choice (Radio)' },
  { value: 'multiCheckbox', label: 'Multiple Choice (Checkboxes)' },
  { value: 'dropdown', label: 'Dropdown Menu' },
  { value: 'signature', label: 'Signature Field' }
];

function FormBlockEditor({ blocks, updateBlocks }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEditBlock, setCurrentEditBlock] = useState(null);
  const [editPath, setEditPath] = useState([]);
  
  // Function to get the full hierarchy path (e.g. 1.2.3) for a block
  const getBlockPath = (blockId, blocksArray = blocks, path = [], parentIdx = null) => {
    for (let i = 0; i < blocksArray.length; i++) {
      const block = blocksArray[i];
      const currentPath = parentIdx !== null ? [...path, i + 1] : [i + 1];
      
      if (block.id === blockId) {
        return currentPath;
      }
      
      if (block.children && block.children.length > 0) {
        const childPath = getBlockPath(blockId, block.children, currentPath, i);
        if (childPath) return childPath;
      }
    }
    
    return null;
  };
  
  // Function to get block by path
  const getBlockByPath = (path, blocksArray = blocks) => {
    if (path.length === 0) return null;
    
    const blockIndex = path[0] - 1;
    if (blockIndex >= blocksArray.length) return null;
    
    if (path.length === 1) {
      return blocksArray[blockIndex];
    }
    
    return getBlockByPath(path.slice(1), blocksArray[blockIndex].children || []);
  };
  
  // Function to update a block in the hierarchy
  const updateBlockInHierarchy = (path, updatedBlock, blocksArray = [...blocks]) => {
    if (path.length === 0) return blocksArray;
    
    const blockIndex = path[0] - 1;
    if (blockIndex >= blocksArray.length) return blocksArray;
    
    if (path.length === 1) {
      blocksArray[blockIndex] = { ...updatedBlock };
      return blocksArray;
    }
    
    blocksArray[blockIndex] = {
      ...blocksArray[blockIndex],
      children: updateBlockInHierarchy(
        path.slice(1),
        updatedBlock,
        [...(blocksArray[blockIndex].children || [])]
      )
    };
    
    return blocksArray;
  };
  
  // Function to add a new block at a specific path
  const addBlockAtPath = (parentPath, newBlock, blocksArray = [...blocks]) => {
    if (parentPath.length === 0) {
      // Add to root level
      return [...blocksArray, newBlock];
    }
    
    const parentIndex = parentPath[0] - 1;
    if (parentIndex >= blocksArray.length) return blocksArray;
    
    if (parentPath.length === 1) {
      blocksArray[parentIndex] = {
        ...blocksArray[parentIndex],
        children: [...(blocksArray[parentIndex].children || []), newBlock]
      };
      return blocksArray;
    }
    
    blocksArray[parentIndex] = {
      ...blocksArray[parentIndex],
      children: addBlockAtPath(
        parentPath.slice(1),
        newBlock,
        [...(blocksArray[parentIndex].children || [])]
      )
    };
    
    return blocksArray;
  };
  
  // Function to delete a block by path
  const deleteBlockByPath = (path, blocksArray = [...blocks]) => {
    if (path.length === 0) return blocksArray;
    
    const blockIndex = path[0] - 1;
    if (blockIndex >= blocksArray.length) return blocksArray;
    
    if (path.length === 1) {
      return blocksArray.filter((_, index) => index !== blockIndex);
    }
    
    blocksArray[blockIndex] = {
      ...blocksArray[blockIndex],
      children: deleteBlockByPath(
        path.slice(1),
        [...(blocksArray[blockIndex].children || [])]
      )
    };
    
    return blocksArray;
  };
  
  // Function to move a block up or down
  const moveBlock = (path, direction, blocksArray = [...blocks]) => {
    if (path.length === 0) return blocksArray;
    
    const blockIndex = path[0] - 1;
    if (blockIndex >= blocksArray.length) return blocksArray;
    
    if (path.length === 1) {
      const newIndex = blockIndex + direction;
      
      // Check if the move is valid
      if (newIndex < 0 || newIndex >= blocksArray.length) {
        return blocksArray;
      }
      
      // Swap blocks
      const updatedBlocks = [...blocksArray];
      const temp = updatedBlocks[blockIndex];
      updatedBlocks[blockIndex] = updatedBlocks[newIndex];
      updatedBlocks[newIndex] = temp;
      
      return updatedBlocks;
    }
    
    blocksArray[blockIndex] = {
      ...blocksArray[blockIndex],
      children: moveBlock(
        path.slice(1),
        direction,
        [...(blocksArray[blockIndex].children || [])]
      )
    };
    
    return blocksArray;
  };
  
  // Open dialog to edit a block
  const openEditDialog = (block, path) => {
    setCurrentEditBlock({ ...block });
    setEditPath(path);
    setEditDialogOpen(true);
  };
  
  // Close edit dialog
  const closeEditDialog = () => {
    setCurrentEditBlock(null);
    setEditPath([]);
    setEditDialogOpen(false);
  };
  
  // Handle saving edits
  const handleSaveEdit = () => {
    if (!currentEditBlock) return;
    
    const updatedBlocks = updateBlockInHierarchy(editPath, currentEditBlock);
    updateBlocks(updatedBlocks);
    closeEditDialog();
  };
  
  // Handle field changes in the edit dialog
  const handleEditFieldChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditBlock(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle switch changes in the edit dialog
  const handleEditSwitchChange = (e) => {
    const { name, checked } = e.target;
    setCurrentEditBlock(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Add a new section
  const addSection = (parentPath, level) => {
    const newSection = {
      id: uuidv4(),
      type: 'section',
      title: `New Section`,
      description: '',
      level,
      children: []
    };
    
    const updatedBlocks = addBlockAtPath(parentPath, newSection);
    updateBlocks(updatedBlocks);
  };
  
  // Add a new field
  const addField = (parentPath) => {
    const parentBlock = getBlockByPath(parentPath);
    const parentLevel = parentBlock ? parentBlock.level : 0;
    
    const newField = {
      id: uuidv4(),
      type: 'field',
      title: 'New Field',
      fieldType: 'text',
      required: false,
      level: parentLevel + 1
    };
    
    const updatedBlocks = addBlockAtPath(parentPath, newField);
    updateBlocks(updatedBlocks);
  };
  
  // Delete a block
  const deleteBlock = (path) => {
    // Prevent deleting the only top-level section
    if (path.length === 1 && path[0] === 1 && blocks.length === 1) {
      alert('Forms must have at least one section');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this block and all its children?')) {
      const updatedBlocks = deleteBlockByPath(path);
      updateBlocks(updatedBlocks);
    }
  };
  
  // Move a block up
  const moveBlockUp = (path) => {
    const lastIndex = path[path.length - 1] - 1;
    if (lastIndex > 0) {
      const updatedBlocks = moveBlock(path, -1);
      updateBlocks(updatedBlocks);
    }
  };
  
  // Move a block down
  const moveBlockDown = (path) => {
    const parentPath = path.slice(0, -1);
    const lastIndex = path[path.length - 1] - 1;
    const parentBlock = parentPath.length ? getBlockByPath(parentPath) : { children: blocks };
    const siblings = parentBlock.children || blocks;
    
    if (lastIndex < siblings.length - 1) {
      const updatedBlocks = moveBlock(path, 1);
      updateBlocks(updatedBlocks);
    }
  };
  
  // Render choices editor (for field types that have options)
  const renderChoicesEditor = () => {
    if (!currentEditBlock) return null;
    
    if (['radio', 'multiCheckbox', 'dropdown'].includes(currentEditBlock.fieldType)) {
      const choices = currentEditBlock.choices || [];
      
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Choices
          </Typography>
          
          {choices.map((choice, index) => (
            <Box key={index} sx={{ display: 'flex', mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={choice}
                onChange={(e) => {
                  const newChoices = [...choices];
                  newChoices[index] = e.target.value;
                  setCurrentEditBlock(prev => ({
                    ...prev,
                    choices: newChoices
                  }));
                }}
                placeholder={`Choice ${index + 1}`}
              />
              <IconButton
                color="error"
                size="small"
                onClick={() => {
                  const newChoices = choices.filter((_, i) => i !== index);
                  setCurrentEditBlock(prev => ({
                    ...prev,
                    choices: newChoices
                  }));
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setCurrentEditBlock(prev => ({
                ...prev,
                choices: [...(prev.choices || []), '']
              }));
            }}
          >
            Add Choice
          </Button>
        </Box>
      );
    }
    
    return null;
  };
  
  // Recursive function to render blocks
  const renderBlocks = (blocksArray = blocks, parentPath = []) => {
    return blocksArray.map((block, index) => {
      const currentPath = [...parentPath, index + 1];
      const pathString = currentPath.join('.');
      const indentLevel = block.level - 1;
      const isSection = block.type === 'section';
      
      // Adjust for indentation
      const indentWidth = indentLevel * 40;
      
      return (
        <Box key={block.id} sx={{ mb: 2 }}>
          <Paper
            sx={{
              p: 2,
              ml: `${indentWidth}px`,
              width: `calc(100% - ${indentWidth}px)`,
              bgcolor: isSection ? 'white' : '#f5f5f5',
              border: '1px solid #e0e0e0',
              borderLeft: isSection 
                ? `4px solid ${block.level === 1 ? '#0064B2' : block.level === 2 ? '#007bff' : '#4dabf5'}`
                : '4px solid #9e9e9e'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography 
                  variant={isSection ? 'h6' : 'subtitle1'} 
                  component="div"
                  color={isSection ? 'primary' : 'textPrimary'}
                >
                  {pathString} {block.title}
                </Typography>
                
                {block.description && (
                  <Typography variant="body2" color="textSecondary">
                    {block.description}
                  </Typography>
                )}
                
                {!isSection && (
                  <Typography variant="body2" color="textSecondary">
                    Type: {FIELD_TYPES.find(t => t.value === block.fieldType)?.label || block.fieldType}
                    {block.required && ' (Required)'}
                  </Typography>
                )}
              </Box>
              
              <Box>
                {/* Control buttons for sections */}
                {isSection && (
                  <>
                    {block.level < 3 && (
                      <Tooltip title={`Add Sub${block.level === 2 ? '-' : ''}section`}>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => addSection(currentPath, block.level + 1)}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Add Field">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => addField(currentPath)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                
                {/* Common controls for all blocks */}
                <Tooltip title="Edit">
                  <IconButton 
                    size="small" 
                    onClick={() => openEditDialog(block, currentPath)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Move Up">
                  <span>
                    <IconButton 
                      size="small" 
                      onClick={() => moveBlockUp(currentPath)}
                      disabled={currentPath[currentPath.length - 1] === 1}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title="Move Down">
                  <span>
                    <IconButton 
                      size="small" 
                      onClick={() => moveBlockDown(currentPath)}
                      disabled={currentPath[currentPath.length - 1] === blocksArray.length}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => deleteBlock(currentPath)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            {/* Render children for sections */}
            {isSection && block.children && block.children.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {renderBlocks(block.children, currentPath)}
              </Box>
            )}
          </Paper>
        </Box>
      );
    });
  };
  
  return (
    <Box>
      {/* Top-level add section button */}
      {blocks.length === 0 && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => addSection([], 1)}
          sx={{ mb: 2 }}
        >
          Add Section
        </Button>
      )}
      
      {/* Render form blocks */}
      {renderBlocks()}
      
      {/* Add a new top-level section */}
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => addSection([], 1)}
        sx={{ mt: 2 }}
      >
        Add Section
      </Button>
      
      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onClose={closeEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentEditBlock?.type === 'section' ? 'Edit Section' : 'Edit Field'}
        </DialogTitle>
        
        <DialogContent>
          {currentEditBlock && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={currentEditBlock.title}
                  onChange={handleEditFieldChange}
                  required
                />
              </Grid>
              
              {currentEditBlock.type === 'section' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={currentEditBlock.description}
                    onChange={handleEditFieldChange}
                    multiline
                    rows={2}
                  />
                </Grid>
              )}
              
              {currentEditBlock.type === 'field' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="field-type-label">Field Type</InputLabel>
                      <Select
                        labelId="field-type-label"
                        id="field-type"
                        name="fieldType"
                        value={currentEditBlock.fieldType || 'text'}
                        onChange={handleEditFieldChange}
                        label="Field Type"
                      >
                        {FIELD_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="required"
                          checked={currentEditBlock.required || false}
                          onChange={handleEditSwitchChange}
                        />
                      }
                      label="Required Field"
                    />
                  </Grid>
                  
                  {/* Render choices editor for field types that need it */}
                  <Grid item xs={12}>
                    {renderChoicesEditor()}
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FormBlockEditor;