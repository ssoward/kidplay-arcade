import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, isLoading, isGuest } = useUser();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated and not in guest mode
  if (requireAuth && !isAuthenticated && !isGuest) {
    // Redirect to login with return URL
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If authentication is not required but user is authenticated, 
  // redirect to profile or a default protected area
  if (!requireAuth && isAuthenticated && location.pathname === redirectTo) {
    return <Navigate to="/profile" replace />;
  }

  // Render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
