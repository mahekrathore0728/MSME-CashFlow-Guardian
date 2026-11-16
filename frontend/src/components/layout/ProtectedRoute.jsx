import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center text-sage">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sage border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-soft font-mono">Authenticating CashFlow Guardian...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
