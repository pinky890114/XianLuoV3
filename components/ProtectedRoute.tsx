
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const isAuthenticated = localStorage.getItem('nocy_admin_auth') === 'true';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAuthReady) {
    // If we are authenticated locally but Firebase auth isn't ready yet, show loading
    // Check if user is already available synchronously
    if (auth.currentUser) {
        return <>{children}</>;
    }
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
