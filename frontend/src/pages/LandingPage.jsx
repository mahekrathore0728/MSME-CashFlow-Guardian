import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  TrendingUp,
  Cpu,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { loadDemoData } = useBusiness();
  const navigate = useNavigate();

  const handleLaunchDemo = async () => {
    if (!isAuthenticated) {
      navigate('/login?demo=true');
    } else {
      await loadDemoData();
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-midnight text-ivory flex flex-col selection:bg-sage selection:text-midnight">
      {/* Top Navbar */}
      <header className="border-b border-olive-muted bg-forest/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sage/15 border border-sage/30 flex items-center justify-center text-sage">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider text-ivory uppercase">
                MSME CashFlow Guardian
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg bg-sage text-midnight font-semibold text-xs tracking-wide hover:bg-sage-hover transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-xs font-medium text-gray-soft hover:text-ivory transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg bg-sage text-midnight font-semibold text-xs tracking-wide hover:bg-sage-hover transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-olive border border-olive-muted text-sage text-xs font-semibold uppercase tracking-wider mb-8">
          <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />
          Predict the Risk. Protect the Business.
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ivory leading-tight max-w-4xl">
          Profits don’t pay the bills. <br />
          <span className="text-sage">Available cash does.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-gray-soft max-w-2xl leading-relaxed">
          Predictive financial intelligence built specifically for Micro, Small, and Medium Enterprises. Monitor customer payment behaviour, detect liquidity shortages 30 days ahead, and stress-test decisions before committing funds.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={handleLaunchDemo}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sage text-midnight font-bold text-sm hover:bg-sage-hover transition-all shadow-card"
          >
            <span>Explore Live Business Demo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl bg-olive border border-olive-muted text-ivory font-semibold text-sm hover:border-sage/40 transition-all"
          >
            Create Business Account
          </Link>
        </div>

        {/* Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-olive flex items-center justify-center text-sage mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-ivory mb-2">30-Day Liquidity Forecast</h3>
            <p className="text-xs text-gray-soft leading-relaxed">
              Deterministic daily cash trajectory mapping contractual vendor dues against realistic customer collection schedules based on historical delay patterns.
            </p>
          </div>

          <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-olive flex items-center justify-center text-champagne mb-4">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-ivory mb-2">Customer Behaviour Intelligence</h3>
            <p className="text-xs text-gray-soft leading-relaxed">
              Transparent 0-100 reliability scoring evaluating on-time ratio, average delay days, and overdue proportions to flag high-risk accounts before cash is trapped.
            </p>
          </div>

          <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-olive flex items-center justify-center text-amber mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-ivory mb-2">What-If Stress Simulator</h3>
            <p className="text-xs text-gray-soft leading-relaxed">
              Test what happens when a top customer delays 15 or 30 days, suppliers hike prices 20%, or an unexpected ₹50,000 expense strikes without altering baseline records.
            </p>
          </div>
        </div>

        {/* Reality Check Callout */}
        <div className="mt-16 bg-olive/50 border border-olive-muted rounded-2xl p-8 text-left max-w-4xl w-full flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-champagne">
              Accounting Profit vs Available Cash
            </span>
            <h4 className="text-lg font-bold text-ivory mt-1">
              Why do profitable enterprises face sudden liquidity crunches?
            </h4>
            <p className="text-xs text-gray-soft mt-2 leading-relaxed">
              Accrual accounting books revenue when an invoice is issued, not when cash clears the bank. MSME CashFlow Guardian bridges the gap between accounting profits and survival liquidity.
            </p>
          </div>
          <button
            onClick={handleLaunchDemo}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-olive border border-champagne/40 text-champagne hover:bg-champagne/10 text-xs font-bold tracking-wide transition-colors"
          >
            See Live Comparison
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-olive-muted py-8 text-center text-xs text-gray-soft">
        <p>MSME CashFlow Guardian • Midnight Luxe Edition • Designed for Indian Enterprise MSMEs (₹ INR)</p>
      </footer>
    </div>
  );
}
