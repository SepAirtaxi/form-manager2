import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration will go here
// You'll need to replace these placeholder values with your actual Firebase project details
const firebaseConfig = {
  apiKey: "AIzaSyBYmYm_RsbwoVSl7jOEp6nzDF4tWbY_o88",
  authDomain: "formmanager2.firebaseapp.com",
  projectId: "formmanager2",
  storageBucket: "formmanager2.firebasestorage.app",
  messagingSenderId: "1061286756294",
  appId: "1:1061286756294:web:e16c5c1b758eb51923bcc7",
  measurementId: "G-HE88FHKM4N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;