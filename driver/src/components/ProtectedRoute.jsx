// driver-app/src/components/ProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { driverApi } from '../services/api';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await driverApi.getProfile();
        const user = response.data?.user || response.data?.data;
        
        if (user?.role === 'driver') {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ✅ Redirect to main app login page
  if (!isAuthenticated) {
    const mainAppUrl = import.meta.env.VITE_MAIN_APP_URL || 'http://localhost:5173';
    window.location.href = `${mainAppUrl}/login`;
    return null;
  }

  return children;
};

export default ProtectedRoute;