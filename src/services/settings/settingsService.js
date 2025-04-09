import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Document and collection references
const companySettingsDoc = doc(db, 'settings', 'company');
const signatoriesCollection = collection(db, 'signatories');

/**
 * Gets company settings
 * @returns {Promise<Object>} The company settings
 */
export const getCompanySettings = async () => {
  try {
    const settingsDoc = await getDoc(companySettingsDoc);
    
    if (!settingsDoc.exists()) {
      // Create default settings if none exist
      const defaultSettings = {
        name: 'Copenhagen AirTaxi',
        address: '',
        contact: '',
        vatNumber: '',
        easaNumber: '',
        logo: null, // Base64 encoded logo
        legalText: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(companySettingsDoc, defaultSettings);
      return defaultSettings;
    }
    
    return settingsDoc.data();
  } catch (error) {
    console.error('Error getting company settings:', error);
    throw error;
  }
};

/**
 * Updates company settings
 * @param {Object} settingsData - The settings data to update
 * @returns {Promise<void>}
 */
export const updateCompanySettings = async (settingsData) => {
  try {
    const updatedSettings = {
      ...settingsData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(companySettingsDoc, updatedSettings);
  } catch (error) {
    console.error('Error updating company settings:', error);
    throw error;
  }
};

/**
 * Gets all authorized signatories
 * @returns {Promise<Array>} Array of signatory objects
 */
export const getSignatories = async () => {
  try {
    const snapshot = await getDocs(signatoriesCollection);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting signatories:', error);
    throw error;
  }
};

/**
 * Creates a new authorized signatory
 * @param {Object} signatoryData - The signatory data
 * @returns {Promise<string>} The ID of the created signatory
 */
export const createSignatory = async (signatoryData) => {
  try {
    // Add created timestamp
    const newSignatory = {
      ...signatoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(signatoriesCollection, newSignatory);
    return docRef.id;
  } catch (error) {
    console.error('Error creating signatory:', error);
    throw error;
  }
};

/**
 * Updates an existing signatory
 * @param {string} signatoryId - The signatory ID
 * @param {Object} signatoryData - The signatory data to update
 * @returns {Promise<void>}
 */
export const updateSignatory = async (signatoryId, signatoryData) => {
  try {
    // Add updated timestamp
    const updatedSignatory = {
      ...signatoryData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(signatoriesCollection, signatoryId), updatedSignatory);
  } catch (error) {
    console.error(`Error updating signatory with ID ${signatoryId}:`, error);
    throw error;
  }
};

/**
 * Deletes a signatory
 * @param {string} signatoryId - The signatory ID
 * @returns {Promise<void>}
 */
export const deleteSignatory = async (signatoryId) => {
  try {
    await deleteDoc(doc(signatoriesCollection, signatoryId));
  } catch (error) {
    console.error(`Error deleting signatory with ID ${signatoryId}:`, error);
    throw error;
  }
};