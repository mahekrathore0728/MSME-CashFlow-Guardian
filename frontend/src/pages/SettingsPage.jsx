import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  ShieldCheck,
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  User,
  Info
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/dates';

export function SettingsPage() {
  const { user } = useAuth();
  const { activeBusiness, refreshBusinesses, loadDemoData, resetDemoData, demoLoading } = useBusiness();

  const [reserveAmount, setReserveAmount] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [demoMessage, setDemoMessage] = useState('');

  useEffect(() => {
    if (activeBusiness) {
      setReserveAmount(String(activeBusiness.minimum_reserve || '100000.00'));
    }
  }, [activeBusiness]);

  const handleSaveReserve = async (e) => {
    e.preventDefault();
    if (!activeBusiness) return;
    setSaveLoading(true);
    setSaveSuccess('');
    try {
      await api.put(`/business/${activeBusiness.id}`, {
        minimum_reserve: parseFloat(reserveAmount) || 100000
      });
      await refreshBusinesses();
      setSaveSuccess("Minimum operating reserve threshold updated successfully.");
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      alert("Failed to update operating reserve limit.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleResetSample = async () => {
    if (!window.confirm("Are you sure you want to reset sample data? This will clear fictional transactions and restore initial baseline records.")) {
      return;
    }
    setDemoMessage('');
    try {
      const res = await resetDemoData();
      setDemoMessage(res.message);
    } catch (err) {
      alert("Failed to reset sample dataset.");
    }
  };

  const handleReloadSample = async () => {
    setDemoMessage('');
    try {
      const res = await loadDemoData();
      setDemoMessage(res.message);
    } catch (err) {
      alert("Failed to load sample dataset.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ivory">
          Enterprise & System Settings
        </h1>
        <p className="text-xs text-gray-soft mt-1">
          Configure operating reserve parameters, business credentials, and sample evaluation environments
        </p>
      </div>

      {/* Business Profile Summary */}
      {activeBusiness && (
        <div className="bg-moss border border-olive-muted rounded-xl p-5 sm:p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-olive-muted/60">
            <Building className="w-4 h-4 text-sage" />
            <h3 className="text-sm sm:text-base font-semibold text-ivory">Active Enterprise Configuration</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs tabular-nums">
            <div className="p-3.5 rounded-lg bg-olive/40 border border-olive-muted">
              <span className="text-[10px] text-gray-soft uppercase font-semibold">Registered Entity</span>
              <p className="text-sm font-bold text-ivory mt-0.5">{activeBusiness.name}</p>
              <p className="text-[10px] text-gray-soft mt-0.5">{activeBusiness.business_type}</p>
            </div>

            <div className="p-3.5 rounded-lg bg-olive/40 border border-olive-muted">
              <span className="text-[10px] text-gray-soft uppercase font-semibold">Base Currency</span>
              <p className="text-sm font-bold text-sage mt-0.5">{activeBusiness.currency} (Indian Rupee ₹)</p>
              <p className="text-[10px] text-gray-soft mt-0.5">Enforces Indian Lakhs & Crores formatting</p>
            </div>

            <div className="p-3.5 rounded-lg bg-olive/40 border border-olive-muted">
              <span className="text-[10px] text-gray-soft uppercase font-semibold">Opening Cash Balance</span>
              <p className="text-sm font-bold text-ivory mt-0.5">{formatINR(activeBusiness.opening_cash_balance)}</p>
              <p className="text-[10px] text-gray-soft mt-0.5">As of {formatDate(activeBusiness.opening_balance_date)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Minimum Operating Reserve Configuration */}
      {activeBusiness && (
        <div className="bg-moss border border-olive-muted rounded-xl p-5 sm:p-6 shadow-card space-y-4">
          <div className="flex items-start sm:items-center gap-3 pb-3 border-b border-olive-muted/60">
            <ShieldCheck className="w-5 h-5 text-amber flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-ivory">Liquidity Safety Buffer (Operating Reserve)</h3>
              <p className="text-xs text-gray-soft">
                Define the minimum cash balance threshold below which the platform flags critical liquidity deficits
              </p>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-lg bg-emerald/10 border border-emerald/25 text-emerald text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveReserve} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-soft mb-1.5 uppercase tracking-wider">
                Minimum Operating Reserve (₹)
              </label>
              <div className="relative max-w-sm">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-amber">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={reserveAmount}
                  onChange={(e) => setReserveAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory tabular-nums focus:outline-none focus:border-sage"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="px-4 py-2 rounded-lg bg-sage text-midnight font-bold text-xs hover:bg-sage-hover disabled:opacity-50 transition-colors"
            >
              {saveLoading ? "Saving..." : "Update Reserve Limit"}
            </button>
          </form>
        </div>
      )}

      {/* Sample Dataset Sandboxing */}
      <div className="bg-moss border border-olive-muted rounded-xl p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex items-start sm:items-center gap-3 pb-3 border-b border-olive-muted/60">
          <Database className="w-5 h-5 text-champagne flex-shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-ivory">Sharma & Co. Sample Dataset Sandbox</h3>
            <p className="text-xs text-gray-soft">
              Manage pre-seeded FMCG wholesale distribution records for risk-free system evaluation
            </p>
          </div>
        </div>

        {demoMessage && (
          <div className="p-3 rounded-lg bg-champagne/10 border border-champagne/25 text-champagne text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{demoMessage}</span>
          </div>
        )}

        <div className="p-3.5 rounded-lg bg-olive/40 border border-olive-muted text-xs text-gray-soft leading-relaxed">
          <p className="font-semibold text-ivory mb-1">Sample Data Disclosure:</p>
          <p>
            Sample data reflects a fictional wholesale enterprise (Sharma & Co.) and contains no real personal or banking records. Resetting or reloading sample data only affects sample-tagged records and will never touch real enterprise accounts.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={handleReloadSample}
            disabled={demoLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-olive/50 border border-champagne/30 text-champagne hover:bg-champagne/10 text-xs font-semibold tracking-wide transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${demoLoading ? 'animate-spin' : ''}`} />
            <span>Re-seed Sample Data</span>
          </button>

          <button
            onClick={handleResetSample}
            disabled={demoLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-olive/50 border border-crimson/30 text-crimson hover:bg-crimson/10 text-xs font-semibold tracking-wide transition-colors disabled:opacity-50"
          >
            <span>Reset Sample Records</span>
          </button>
        </div>
      </div>

      {/* User Account Info */}
      <div className="bg-moss border border-olive-muted rounded-xl p-5 sm:p-6 shadow-card space-y-3">
        <div className="flex items-center gap-2.5 pb-3 border-b border-olive-muted/60">
          <User className="w-4 h-4 text-gray-soft" />
          <h3 className="text-sm sm:text-base font-semibold text-ivory">Administrator Credentials</h3>
        </div>
        <div className="text-xs space-y-1.5 text-gray-soft">
          <p><span className="text-ivory font-medium">Name:</span> {user?.full_name}</p>
          <p><span className="text-ivory font-medium">Email:</span> {user?.email}</p>
          <p><span className="text-ivory font-medium">Security Protocol:</span> Bcrypt Hashed + HMAC-SHA256 JWT Token</p>
        </div>
      </div>
    </div>
  );
}
