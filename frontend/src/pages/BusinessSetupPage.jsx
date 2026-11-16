import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Calendar, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { getCurrentISODate } from '../utils/dates';

export function BusinessSetupPage() {
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('Wholesale Distribution');
  const [openingBalance, setOpeningBalance] = useState('250000.00');
  const [openingDate, setOpeningDate] = useState(getCurrentISODate());
  const [minimumReserve, setMinimumReserve] = useState('100000.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { refreshBusinesses, selectBusiness } = useBusiness();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/business', {
        name,
        business_type: businessType,
        currency: 'INR',
        opening_cash_balance: parseFloat(openingBalance) || 0,
        opening_balance_date: openingDate,
        minimum_reserve: parseFloat(minimumReserve) || 100000
      });

      await refreshBusinesses();
      selectBusiness(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to configure enterprise. Please verify details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight text-ivory flex flex-col justify-between p-4 sm:p-6 selection:bg-sage selection:text-midnight">
      <div className="w-full max-w-xl mx-auto pt-2 sm:pt-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-soft hover:text-ivory transition-colors py-1.5 px-3 rounded-lg bg-olive/50 hover:bg-olive border border-olive-muted"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="w-full max-w-xl mx-auto my-auto py-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-sage/10 border border-sage/25 text-sage mb-3">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ivory uppercase">
            Configure Enterprise Entity
          </h2>
          <p className="text-xs text-gray-soft mt-1">
            Establish financial baseline parameters for accurate liquidity forecasting
          </p>
        </div>

        <div className="bg-moss border border-olive-muted rounded-xl p-6 sm:p-8 shadow-card">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-crimson/10 border border-crimson/25 text-crimson text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-soft mb-1.5 uppercase tracking-wider">
                Enterprise / Trading Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Agarwal Provisions & Spices"
                className="w-full px-3.5 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory placeholder:text-gray-soft/50 focus:outline-none focus:border-sage transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-soft mb-1.5 uppercase tracking-wider">
                Industry / Business Classification
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory focus:outline-none focus:border-sage transition-colors"
              >
                <option value="Wholesale Distribution">Wholesale Distribution</option>
                <option value="Manufacturing & Fabrication">Manufacturing & Fabrication</option>
                <option value="Retail & FMCG">Retail & FMCG</option>
                <option value="Contracting & Services">Contracting & Services</option>
                <option value="Logistics & Warehousing">Logistics & Warehousing</option>
                <option value="Agri-Trade & Commodities">Agri-Trade & Commodities</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-soft mb-1.5 uppercase tracking-wider">
                  Opening Cash Balance (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-xs font-bold text-sage">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    placeholder="250000.00"
                    className="w-full pl-8 pr-3.5 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory tabular-nums focus:outline-none focus:border-sage transition-colors"
                  />
                </div>
                <p className="text-[10px] text-gray-soft mt-1">Reconciled bank balance on baseline date</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-soft mb-1.5 uppercase tracking-wider">
                  Baseline Start Date
                </label>
                <input
                  type="date"
                  required
                  value={openingDate}
                  onChange={(e) => setOpeningDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory focus:outline-none focus:border-sage transition-colors"
                />
                <p className="text-[10px] text-gray-soft mt-1">Starting anchor for calculations</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-soft mb-1.5 uppercase tracking-wider">
                Minimum Operating Reserve Threshold (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2 text-xs font-bold text-amber">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={minimumReserve}
                  onChange={(e) => setMinimumReserve(e.target.value)}
                  placeholder="100000.00"
                  className="w-full pl-8 pr-3.5 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory tabular-nums focus:outline-none focus:border-sage transition-colors"
                />
              </div>
              <p className="text-[10px] text-gray-soft mt-1">
                Cash safety limit below which the engine triggers liquidity deficit warnings
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-sage text-midnight font-bold text-xs hover:bg-sage-hover transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? "Configuring..." : "Save Configuration & Enter Platform"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      <div className="text-center text-[10px] text-gray-muted py-2">
        MSME CashFlow Guardian • Graphite Noir Edition
      </div>
    </div>
  );
}
