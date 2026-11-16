import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = fullName.trim();
    if (!cleanName) {
      setError("Please provide your full name or enterprise owner title.");
      return;
    }

    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError("Please provide a valid business email address.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long for enterprise security.");
      return;
    }

    setLoading(true);
    try {
      await register(cleanEmail, password, cleanName);
      navigate('/setup');
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

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

      {/* Main Registration Card */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-sage/10 border border-sage/25 text-sage mb-3">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-ivory uppercase">
            Create Business Account
          </h2>
          <p className="text-xs text-gray-soft mt-1">
            Empower your enterprise with predictive cashflow defense
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
                Full Name / Business Representative
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-gray-soft" />
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-olive/60 border border-olive-muted text-xs text-ivory placeholder:text-gray-soft/50 focus:outline-none focus:border-sage transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-soft mb-1.5 uppercase tracking-wider">
                Business Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-gray-soft" />
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@yourbusiness.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-olive/60 border border-olive-muted text-xs text-ivory placeholder:text-gray-soft/50 focus:outline-none focus:border-sage transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-soft mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-gray-soft" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-2 rounded-lg bg-olive/60 border border-olive-muted text-xs text-ivory placeholder:text-gray-soft/50 focus:outline-none focus:border-sage transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={loading}
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
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-sage text-midnight font-bold text-xs tracking-wide hover:bg-sage-hover transition-colors shadow-sm disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register & Setup Enterprise</span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-soft mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-sage font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <div className="text-center text-[10px] text-gray-muted py-2">
        MSME CashFlow Guardian • Graphite Noir Edition
      </div>
    </div>
  );
}
