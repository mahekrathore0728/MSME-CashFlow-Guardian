import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  Lock,
  Mail,
  AlertCircle,
  Database,
  ArrowLeft,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const { login, loginDemoSession } = useAuth();
  const { refreshBusinesses } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();

  const isDemoRedirect = location.search.includes('demo=true');

  const validateInputs = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address (e.g. name@company.com).");
      return false;
    }
    if (!password) {
      setError("Please enter your account password.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      await refreshBusinesses();
      navigate('/dashboard');
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setError("Invalid email or password. Please verify your credentials.");
        } else if (err.response.data?.detail) {
          setError(String(err.response.data.detail));
        } else {
          setError(`Authentication failed with status ${err.response.status}. Please try again.`);
        }
      } else if (err.request) {
        setError("Network error: Unable to connect to the CashFlow Guardian server. Please verify the backend is running.");
      } else {
        setError("An unexpected error occurred during sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchDemo = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await loginDemoSession();
      await refreshBusinesses();
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(String(err.response.data.detail));
      } else if (err.request) {
        setError("Network error: Could not reach backend server to provision demo session.");
      } else {
        setError("Unable to initialize demo account session. Please try again.");
      }
    } finally {
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoRedirect) {
      handleLaunchDemo();
    }
  }, [isDemoRedirect]);

  const isAnyLoading = loading || demoLoading;

  return (
    <div className="min-h-screen bg-midnight text-ivory flex flex-col justify-between p-6 selection:bg-sage selection:text-midnight">
      {/* Top Left Navigation Bar */}
      <div className="w-full max-w-5xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-soft hover:text-sage transition-colors py-2 px-3 rounded-lg hover:bg-olive/40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sage/15 border border-sage/30 text-sage mb-3 shadow-subtle">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-ivory uppercase">
            MSME CashFlow Guardian
          </h2>
          <p className="text-xs text-gray-soft mt-1">
            Sign in to access your enterprise financial intelligence
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-moss border border-olive-muted rounded-2xl p-6 sm:p-8 shadow-card">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-crimson/10 border border-crimson/30 flex items-start gap-3 text-crimson text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-gray-soft mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-gray-soft pointer-events-none" />
                <input
                  type="email"
                  disabled={isAnyLoading}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="owner@yourbusiness.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-olive border border-olive-muted text-sm text-ivory placeholder:text-gray-soft/50 focus:outline-none focus:border-sage transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-soft mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-gray-soft pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={isAnyLoading}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-olive border border-olive-muted text-sm text-ivory placeholder:text-gray-soft/50 focus:outline-none focus:border-sage transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={isAnyLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 text-gray-soft hover:text-ivory transition-colors disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAnyLoading}
              className="w-full py-2.5 rounded-xl bg-sage text-midnight font-bold text-sm hover:bg-sage-hover transition-colors shadow-sm disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Instant Demo Sandbox Access */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-olive-muted" />
            </div>
            <span className="relative px-3 bg-moss text-[11px] uppercase tracking-wider text-gray-soft font-semibold">
              Instant Demo Sandbox
            </span>
          </div>

          <button
            type="button"
            onClick={handleLaunchDemo}
            disabled={isAnyLoading}
            className="w-full py-2.5 rounded-xl bg-olive border border-champagne/40 text-champagne hover:bg-champagne/10 font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {demoLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Launching Sandbox...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                <span>Launch Sharma & Co. Demo Account</span>
              </>
            )}
          </button>
        </div>

        {/* Footer Navigation */}
        <p className="text-center text-xs text-gray-soft mt-6">
          Don't have an enterprise account?{' '}
          <Link to="/register" className="text-sage font-medium hover:underline">
            Register here
          </Link>
        </p>
      </div>

      {/* Subtle Bottom Credit */}
      <div className="text-center text-[11px] text-gray-muted py-2">
        MSME CashFlow Guardian • Secure Financial Analytics
      </div>
    </div>
  );
}
