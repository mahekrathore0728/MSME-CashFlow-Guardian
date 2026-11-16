import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';

import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BusinessSetupPage } from './pages/BusinessSetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { ForecastPage } from './pages/ForecastPage';
import { StressSimulatorPage } from './pages/StressSimulatorPage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <BusinessProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/setup" element={<BusinessSetupPage />} />
              
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/:id" element={<CustomerDetailPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/forecast" element={<ForecastPage />} />
                <Route path="/stress-simulator" element={<StressSimulatorPage />} />
                <Route path="/ai-insights" element={<AIInsightsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BusinessProvider>
      </AuthProvider>
    </Router>
  );
}
