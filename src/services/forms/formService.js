import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';

// Collection references
const formsCollection = collection(db, 'forms');
const submissionsCollection = collection(db, 'submissions');

/**
 * Gets all forms
 * @param {boolean} publishedOnly - If true, only returns published forms
 * @returns {Promise<Array>} Array of form objects
 */
export const getForms = async (publishedOnly = false) => {
  try {
    let formQuery = formsCollection;
    
    if (publishedOnly) {
      formQuery = query(formsCollection, where('published', '==', true));
    }
    
    const snapshot = await getDocs(formQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting forms:', error);
    throw error;
  }
};

/**
 * Gets a form by ID
 * @param {string} formId - The form ID
 * @returns {Promise<Object>} The form object
 */
export const getFormById = async (formId) => {
  try {
    const formDoc = await getDoc(doc(formsCollection, formId));
    
    if (!formDoc.exists()) {
      throw new Error(`Form with ID ${formId} not found`);
    }
    
    return {
      id: formDoc.id,
      ...formDoc.data()
    };
  } catch (error) {
    console.error(`Error getting form with ID ${formId}:`, error);
    throw error;
  }
};

/**
 * Creates a new form
 * @param {Object} formData - The form data
 * @returns {Promise<string>} The ID of the created form
 */
export const createForm = async (formData) => {
  try {
    // Generate a new document ID
    const newFormRef = doc(formsCollection);
    
    // Initialize with default values
    const newForm = {
      ...formData,
      published: formData.published || false,
      revision: formData.revision || '1.0',
      blocks: formData.blocks || [{
        id: uuidv4(),
        type: 'section',
        title: 'Section 1',
        description: '',
        level: 1,
        children: []
      }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(newFormRef, newForm);
    return newFormRef.id;
  } catch (error) {
    console.error('Error creating form:', error);
    throw error;
  }
};

/**
 * Updates an existing form
 * @param {string} formId - The form ID
 * @param {Object} formData - The form data to update
 * @returns {Promise<void>}
 */
export const updateForm = async (formId, formData) => {
  try {
    // Add updated timestamp
    const updatedForm = {
      ...formData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(formsCollection, formId), updatedForm);
  } catch (error) {
    console.error(`Error updating form with ID ${formId}:`, error);
    throw error;
  }
};

/**
 * Deletes a form
 * @param {string} formId - The form ID
 * @returns {Promise<void>}
 */
export const deleteForm = async (formId) => {
  try {
    await deleteDoc(doc(formsCollection, formId));
  } catch (error) {
    console.error(`Error deleting form with ID ${formId}:`, error);
    throw error;
  }
};

/**
 * Publishes a form (sets published = true)
 * @param {string} formId - The form ID
 * @returns {Promise<void>}
 */
export const publishForm = async (formId) => {
  try {
    await updateDoc(doc(formsCollection, formId), {
      published: true,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error publishing form with ID ${formId}:`, error);
    throw error;
  }
};

/**
 * Updates the form revision
 * @param {string} formId - The form ID
 * @param {string} revision - The new revision number
 * @param {boolean} isMajor - Whether this is a major revision
 * @returns {Promise<void>}
 */
export const updateFormRevision = async (formId, revision, isMajor = false) => {
  try {
    await updateDoc(doc(formsCollection, formId), {
      revision,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error updating revision for form with ID ${formId}:`, error);
    throw error;
  }
};

/**
 * Submits a completed form
 * @param {string} formId - The form ID
 * @param {Object} formData - The completed form data
 * @param {string} userId - The user ID who submitted the form
 * @returns {Promise<string>} The ID of the submission
 */
export const submitForm = async (formId, formData, userId) => {
  try {
    // Generate a new document ID
    const newSubmissionRef = doc(submissionsCollection);
    
    const submission = {
      formId,
      userId,
      data: formData,
      submittedAt: serverTimestamp()
    };
    
    await setDoc(newSubmissionRef, submission);
    return newSubmissionRef.id;
  } catch (error) {
    console.error('Error submitting form:', error);
    throw error;
  }
};

/**
 * Saves a form draft
 * @param {string} formId - The form ID
 * @param {Object} formData - The form data
 * @param {string} userId - The user ID
 * @returns {Promise<string>} The ID of the draft
 */
export const saveFormDraft = async (formId, formData, userId) => {
  try {
    // Use a specific collection for drafts
    const draftsCollection = collection(db, 'drafts');
    
    // Look for existing draft
    const draftQuery = query(
      draftsCollection,
      where('formId', '==', formId),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(draftQuery);
    
    if (!snapshot.empty) {
      // Update existing draft
      const draftId = snapshot.docs[0].id;
      await updateDoc(doc(draftsCollection, draftId), {
        data: formData,
        updatedAt: serverTimestamp()
      });
      return draftId;
    } else {
      // Create new draft
      const newDraftRef = doc(draftsCollection);
      const draft = {
        formId,
        userId,
        data: formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(newDraftRef, draft);
      return newDraftRef.id;
    }
  } catch (error) {
    console.error('Error saving form draft:', error);
    throw error;
  }
};

/**
 * Gets user's draft for a form
 * @param {string} formId - The form ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The draft or null if not found
 */
export const getFormDraft = async (formId, userId) => {
  try {
    const draftsCollection = collection(db, 'drafts');
    const draftQuery = query(
      draftsCollection,
      where('formId', '==', formId),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(draftQuery);
    
    if (snapshot.empty) {
      return null;
    }
    
    const draftDoc = snapshot.docs[0];
    return {
      id: draftDoc.id,
      ...draftDoc.data()
    };
  } catch (error) {
    console.error('Error getting form draft:', error);
    throw error;
  }
};