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
  serverTimestamp 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  updateEmail,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, db } from '../firebase/config';

// Collection reference
const usersCollection = collection(db, 'users');

/**
 * Gets all users
 * @returns {Promise<Array>} Array of user objects
 */
export const getUsers = async () => {
  try {
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

/**
 * Gets a user by ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} The user object
 */
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(usersCollection, userId));
    
    if (!userDoc.exists()) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error(`Error getting user with ID ${userId}:`, error);
    throw error;
  }
};

/**
 * Creates a new user
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @param {string} name - The user's name
 * @param {string} role - The user's role (admin, manager, employee)
 * @returns {Promise<string>} The ID of the created user
 */
export const createUser = async (email, password, name, role = 'employee') => {
  try {
    // Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    
    // Create the user document in Firestore
    const userData = {
      email,
      name,
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(usersCollection, userId), userData);
    return userId;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Updates a user's profile
 * @param {string} userId - The user ID
 * @param {Object} userData - The user data to update
 * @returns {Promise<void>}
 */
export const updateUser = async (userId, userData) => {
  try {
    // Update email if provided and different
    if (userData.email) {
      const userDoc = await getDoc(doc(usersCollection, userId));
      const currentEmail = userDoc.data().email;
      
      if (userData.email !== currentEmail) {
        // This requires the user to be recently logged in,
        // may need to handle this differently in a real app
        await updateEmail(auth.currentUser, userData.email);
      }
    }
    
    // Update user document
    const updatedData = {
      ...userData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(usersCollection, userId), updatedData);
  } catch (error) {
    console.error(`Error updating user with ID ${userId}:`, error);
    throw error;
  }
};

/**
 * Deletes a user
 * Note: This only deletes the Firestore document. In a production app,
 * you would also need to delete the user from Firebase Authentication.
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(usersCollection, userId));
    // In a real application, you would also delete the user from Firebase Auth
    // This requires admin SDK which is typically done in a Cloud Function
  } catch (error) {
    console.error(`Error deleting user with ID ${userId}:`, error);
    throw error;
  }
};

/**
 * Sends a password reset email to a user
 * @param {string} email - The user's email
 * @returns {Promise<void>}
 */
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error(`Error sending password reset email to ${email}:`, error);
    throw error;
  }
};

/**
 * Gets users by role
 * @param {string} role - The role to filter by
 * @returns {Promise<Array>} Array of user objects
 */
export const getUsersByRole = async (role) => {
  try {
    const userQuery = query(usersCollection, where('role', '==', role));
    const snapshot = await getDocs(userQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting users with role ${role}:`, error);
    throw error;
  }
};