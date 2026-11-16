import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, IndianRupee, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
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
      setError(err.response?.data?.detail || "Failed to create business. Please check details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight text-ivory flex items-center justify-center p-6 selection:bg-sage selection:text-midnight">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sage/15 border border-sage/30 text-sage mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-ivory">
            Configure Your Business
          </h2>
          <p className="text-xs text-gray-soft mt-1">
            Establish financial baseline parameters for accurate liquidity forecasting
          </p>
        </div>

        <div className="bg-moss border border-olive-muted rounded-2xl p-8 shadow-card">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-crimson/10 border border-crimson/30 text-crimson text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-soft mb-1.5 uppercase tracking-wider">
                Enterprise / Trading Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Agarwal Provisions & Spices"
                className="w-full px-4 py-2.5 rounded-xl bg-olive border border-olive-muted text-sm text-ivory placeholder:text-gray-soft/50 focus:outline-none focus:border-sage transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-soft mb-1.5 uppercase tracking-wider">
                Industry / Business Classification
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-olive border border-olive-muted text-sm text-ivory focus:outline-none focus:border-sage transition-colors"
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
                <label className="block text-xs font-semibold text-gray-soft mb-1.5 uppercase tracking-wider">
                  Opening Cash Balance (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-sage">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    placeholder="250000.00"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-olive border border-olive-muted text-sm text-ivory tabular-nums focus:outline-none focus:border-sage transition-colors"
                  />
                </div>
                <p className="text-[10px] text-gray-soft mt-1">Physical bank balance on start date</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-soft mb-1.5 uppercase tracking-wider">
                  Baseline Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={openingDate}
                    onChange={(e) => setOpeningDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-olive border border-olive-muted text-sm text-ivory focus:outline-none focus:border-sage transition-colors"
                  />
                </div>
                <p className="text-[10px] text-gray-soft mt-1">Starting point for calculations</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-soft mb-1.5 uppercase tracking-wider">
                Minimum Operating Reserve Threshold (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-amber">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={minimumReserve}
                  onChange={(e) => setMinimumReserve(e.target.value)}
                  placeholder="100000.00"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-olive border border-olive-muted text-sm text-ivory tabular-nums focus:outline-none focus:border-sage transition-colors"
                />
              </div>
              <p className="text-[10px] text-gray-soft mt-1">
                Threshold below which CashFlow Guardian triggers liquidity safety warnings
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-sage text-midnight font-bold text-sm hover:bg-sage-hover transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? "Initializing..." : "Complete Setup & Launch Dashboard"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
