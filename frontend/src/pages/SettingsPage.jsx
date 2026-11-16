import React, { useState, useEffect } from 'react';
import { Settings, Building, ShieldCheck, Database, RefreshCw, AlertTriangle, CheckCircle2, User } from 'lucide-react';
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
      alert("Failed to update reserve settings.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm("Are you sure you want to reset the demo data? This will clear fictional transactions and invoices.")) {
      return;
    }
    setDemoMessage('');
    try {
      const res = await resetDemoData();
      setDemoMessage(res.message);
    } catch (err) {
      alert("Failed to reset demo dataset.");
    }
  };

  const handleReloadDemo = async () => {
    setDemoMessage('');
    try {
      const res = await loadDemoData();
      setDemoMessage(res.message);
    } catch (err) {
      alert("Failed to load demo dataset.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ivory">System & Business Settings</h1>
        <p className="text-xs text-gray-soft mt-1">
          Configure operating reserve parameters, business credentials, and demo data sandboxes
        </p>
      </div>

      {/* Business Profile Summary */}
      {activeBusiness && (
        <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-olive-muted">
            <Building className="w-5 h-5 text-sage" />
            <h3 className="text-base font-semibold text-ivory">Active Business Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs tabular-nums">
            <div className="p-3.5 rounded-xl bg-olive border border-olive-muted">
              <span className="text-[10px] text-gray-soft uppercase font-semibold">Business Name</span>
              <p className="text-sm font-bold text-ivory mt-0.5">{activeBusiness.name}</p>
              <p className="text-[10px] text-gray-soft mt-0.5">{activeBusiness.business_type}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-olive border border-olive-muted">
              <span className="text-[10px] text-gray-soft uppercase font-semibold">Base Currency</span>
              <p className="text-sm font-bold text-sage mt-0.5">{activeBusiness.currency} (Indian Rupee ₹)</p>
              <p className="text-[10px] text-gray-soft mt-0.5">Enforces Indian Lakhs / Crores notation</p>
            </div>

            <div className="p-3.5 rounded-xl bg-olive border border-olive-muted">
              <span className="text-[10px] text-gray-soft uppercase font-semibold">Opening Cash Balance</span>
              <p className="text-sm font-bold text-ivory mt-0.5">{formatINR(activeBusiness.opening_cash_balance)}</p>
              <p className="text-[10px] text-gray-soft mt-0.5">As of {formatDate(activeBusiness.opening_balance_date)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Minimum Operating Reserve Configuration */}
      {activeBusiness && (
        <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-olive-muted">
            <ShieldCheck className="w-5 h-5 text-amber" />
            <div>
              <h3 className="text-base font-semibold text-ivory">Liquidity Safety Buffer (Minimum Reserve)</h3>
              <p className="text-xs text-gray-soft">
                Define the cash threshold below which the platform flags critical liquidity deficits
              </p>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-sage/10 border border-sage/30 text-sage text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveReserve} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-soft mb-1.5 uppercase tracking-wider">
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
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-olive border border-olive-muted text-sm text-ivory tabular-nums focus:outline-none focus:border-sage"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="px-5 py-2 rounded-xl bg-sage text-midnight font-bold text-xs hover:bg-sage-hover disabled:opacity-50"
            >
              {saveLoading ? "Saving..." : "Update Reserve Limit"}
            </button>
          </form>
        </div>
      )}

      {/* Demo Dataset Sandboxing */}
      <div className="bg-moss border border-champagne/30 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-olive-muted">
          <Database className="w-5 h-5 text-champagne" />
          <div>
            <h3 className="text-base font-semibold text-ivory">Sharma & Co. Fictional Dataset Sandbox</h3>
            <p className="text-xs text-gray-soft">
              Load or reset the pre-seeded wholesale distribution business dataset
            </p>
          </div>
        </div>

        {demoMessage && (
          <div className="p-3 rounded-xl bg-champagne/10 border border-champagne/30 text-champagne text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{demoMessage}</span>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-olive border border-olive-muted text-xs text-gray-soft">
          <p className="font-semibold text-ivory mb-1">Dataset Notice & Disclaimer:</p>
          <p>
            Demo data represents a fictional wholesale distribution business and does not contain real financial records. Resetting demo data will only wipe fictional transactions and will never delete real user businesses.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleReloadDemo}
            disabled={demoLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-olive border border-champagne/40 text-champagne hover:bg-champagne/10 text-xs font-semibold tracking-wide transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${demoLoading ? 'animate-spin' : ''}`} />
            <span>Re-seed Sharma & Co. Dataset</span>
          </button>

          <button
            onClick={handleResetDemo}
            disabled={demoLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-olive border border-crimson/40 text-crimson hover:bg-crimson/10 text-xs font-semibold tracking-wide transition-colors disabled:opacity-50"
          >
            <span>Reset Demo Records</span>
          </button>
        </div>
      </div>

      {/* User Account Info */}
      <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card space-y-3">
        <div className="flex items-center gap-3 pb-3 border-b border-olive-muted">
          <User className="w-5 h-5 text-gray-soft" />
          <h3 className="text-base font-semibold text-ivory">Account Information</h3>
        </div>
        <div className="text-xs space-y-1.5 text-gray-soft">
          <p><span className="text-ivory font-medium">Name:</span> {user?.full_name}</p>
          <p><span className="text-ivory font-medium">Email:</span> {user?.email}</p>
          <p><span className="text-ivory font-medium">Authentication:</span> Secure Bcrypt + JWT (HS256)</p>
        </div>
      </div>
    </div>
  );
}
