import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, User, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
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

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please provide a valid business email address.');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long for enterprise security.');
      return;
    }

    setLoading(true);
    try {
      await register(cleanEmail, password, fullName.trim());
      navigate('/setup');
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight text-ivory flex items-center justify-center p-6 selection:bg-sage selection:text-midnight relative">
      <div className="absolute top-6 left-6 md:top-8 md:left-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-soft hover:text-ivory transition-colors py-2 px-3 rounded-lg bg-olive/40 hover:bg-olive border border-olive-muted/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="w-full max-w-md pt-8 md:pt-0">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sage/15 border border-sage/30 text-sage mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-ivory uppercase">
            Create Business Account
          </h2>
          <p className="text-xs text-gray-soft mt-1">
            Empower your enterprise with predictive cashflow defense
          </p>
        </div>

        <div className="bg-moss border border-olive-muted rounded-2xl p-8 shadow-card">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-crimson/10 border border-crimson/30 flex items-center gap-3 text-crimson text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-soft mb-1.5 uppercase tracking-wider">
                Full Name
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-olive border border-olive-muted text-sm text-ivory placeholder:text-gray-soft/50 focus:outline-none focus:border-sage transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-soft mb-1.5 uppercase tracking-wider">
                Email Address
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-olive border border-olive-muted text-sm text-ivory placeholder:text-gray-soft/50 focus:outline-none focus:border-sage transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-soft mb-1.5 uppercase tracking-wider">
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
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-olive border border-olive-muted text-sm text-ivory placeholder:text-gray-soft/50 focus:outline-none focus:border-sage transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={loading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-gray-soft hover:text-ivory transition-colors p-0.5 rounded focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-sage text-midnight font-bold text-sm hover:bg-sage-hover transition-colors shadow-sm disabled:opacity-50 mt-2"
            >
              {loading ? "Creating Account..." : "Register & Configure Business"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-soft mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-sage font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
