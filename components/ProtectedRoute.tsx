
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { ADMIN_EMAILS } from '../constants';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // 檢查邏輯：
      // 1. 使用者必須存在
      // 2. 使用者必須有 email (匿名登入沒有 email)
      // 3. Email 必須在白名單內
      if (currentUser && currentUser.email && ADMIN_EMAILS.includes(currentUser.email)) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-siam-cream">
        <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-siam-brown">驗證身份中...</p>
        </div>
      </div>
    );
  }

  // 如果未授權，導向登入頁面
  if (!isAuthorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
