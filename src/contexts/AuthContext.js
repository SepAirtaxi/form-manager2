import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../services/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Fetch user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            console.error('User document does not exist');
            setUserRole('employee'); // Default role
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserRole('employee'); // Default role on error
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Check if user has required role
  const hasRole = (requiredRole) => {
    if (!userRole) return false;
    
    // Role hierarchy: admin > manager > employee
    if (userRole === 'admin') return true;
    if (userRole === 'manager' && requiredRole !== 'admin') return true;
    if (userRole === 'employee' && requiredRole === 'employee') return true;
    
    return false;
  };

  const value = {
    currentUser,
    userRole,
    hasRole,
    isAdmin: userRole === 'admin',
    isManager: userRole === 'manager' || userRole === 'admin',
    isEmployee: userRole === 'employee' || userRole === 'manager' || userRole === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}