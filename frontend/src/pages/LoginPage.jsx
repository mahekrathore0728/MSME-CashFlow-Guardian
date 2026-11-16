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
  RefreshCw,
  Info
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
      setError("Please enter your registered email address.");
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
          setError(`Authentication failed (HTTP ${err.response.status}). Please try again.`);
        }
      } else if (err.request) {
        setError("Network error: Unable to connect to the server. Please ensure the backend is running.");
      } else {
        setError("An unexpected error occurred during sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchSample = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await loginDemoSession();
      await refreshBusinesses();
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(String(err.response.data.detail));
      } else {
        setError("Unable to provision sample workspace. Please verify backend service availability.");
      }
    } finally {
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoRedirect) {
      handleLaunchSample();
    }
  }, [isDemoRedirect]);

  const isAnyLoading = loading || demoLoading;

  return (
    <div className="min-h-screen bg-midnight text-ivory flex flex-col justify-between p-4 sm:p-6 selection:bg-sage selection:text-midnight">
      {/* Top Bar with Navigation */}
      <div className="w-full max-w-md mx-auto pt-2 sm:pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-soft hover:text-ivory transition-colors py-1.5 px-3 rounded-lg bg-olive/50 hover:bg-olive border border-olive-muted"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-sage/10 border border-sage/25 text-sage mb-3">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-ivory uppercase">
            MSME CashFlow Guardian
          </h2>
          <p className="text-xs text-gray-soft mt-1">
            Predict the Risk. Protect the Business.
          </p>
        </div>

        <div className="bg-moss border border-olive-muted rounded-xl p-6 sm:p-7 shadow-card">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-crimson/10 border border-crimson/25 flex items-start gap-2.5 text-crimson text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-soft mb-1.5 uppercase tracking-wider">
                Business Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-gray-soft" />
                <input
                  type="email"
                  required
                  disabled={isAnyLoading}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="owner@yourcompany.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-olive/60 border border-olive-muted text-xs text-ivory placeholder:text-gray-soft/50 focus:outline-none focus:border-sage transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-soft mb-1.5 uppercase tracking-wider">
                Account Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-gray-soft" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isAnyLoading}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2 rounded-lg bg-olive/60 border border-olive-muted text-xs text-ivory placeholder:text-gray-soft/50 focus:outline-none focus:border-sage transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={isAnyLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-0.5 text-gray-soft hover:text-ivory transition-colors disabled:opacity-50"
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
              className="w-full py-2.5 rounded-lg bg-sage text-midnight font-bold text-xs tracking-wide hover:bg-sage-hover transition-colors shadow-sm disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to Account</span>
              )}
            </button>
          </form>

          {/* Sample Workspace Access Divider */}
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-olive-muted/60" />
            </div>
            <span className="relative px-3 bg-moss text-[10px] uppercase tracking-wider text-gray-soft font-semibold">
              Evaluation Access
            </span>
          </div>

          {/* Explore Sample Workspace Button */}
          <button
            type="button"
            onClick={handleLaunchSample}
            disabled={isAnyLoading}
            className="w-full py-2.5 rounded-lg bg-olive/50 border border-champagne/30 text-champagne hover:bg-champagne/10 font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {demoLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Initializing Workspace...</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                <span>Explore Sample Workspace</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-gray-soft text-center mt-2 flex items-center justify-center gap-1">
            <Info className="w-3 h-3 flex-shrink-0" />
            <span>Contains fictional financial records for risk-free system evaluation.</span>
          </p>
        </div>

        {/* Footer Navigation */}
        <p className="text-center text-xs text-gray-soft mt-5">
          Don't have an enterprise account?{' '}
          <Link to="/register" className="text-sage font-medium hover:underline">
            Register your enterprise
          </Link>
        </p>
      </div>

      {/* Subtle Bottom Credit */}
      <div className="text-center text-[10px] text-gray-muted py-2">
        MSME CashFlow Guardian • Graphite Noir Edition
      </div>
    </div>
  );
}
