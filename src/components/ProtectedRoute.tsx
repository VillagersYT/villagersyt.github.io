import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser?.isAdmin) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;