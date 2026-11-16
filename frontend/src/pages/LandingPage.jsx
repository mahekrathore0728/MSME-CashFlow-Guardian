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

  const handleLaunchSample = async () => {
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
      <header className="border-b border-olive-muted bg-forest/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sage/10 border border-sage/25 flex items-center justify-center text-sage">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-xs tracking-wider text-ivory uppercase">
                MSME CashFlow Guardian
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-3.5 py-1.5 rounded-lg bg-sage text-midnight font-semibold text-xs tracking-wide hover:bg-sage-hover transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-soft hover:text-ivory transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg bg-sage text-midnight font-semibold text-xs tracking-wide hover:bg-sage-hover transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-olive/60 border border-olive-muted text-sage text-[11px] font-semibold uppercase tracking-wider mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-sage" />
          Predict the Risk. Protect the Business.
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-ivory leading-tight max-w-4xl">
          Profits don’t settle debts. <br />
          <span className="text-sage">Available liquidity does.</span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-gray-soft max-w-2xl leading-relaxed">
          Predictive financial intelligence built specifically for Micro, Small, and Medium Enterprises. Monitor customer payment delays, forecast cash shortages 30 days ahead, and stress-test decisions before committing funds.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={handleLaunchSample}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sage text-midnight font-bold text-xs hover:bg-sage-hover transition-colors shadow-card"
          >
            <span>Explore Sample Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <Link
            to="/register"
            className="px-5 py-2.5 rounded-lg bg-olive/60 border border-olive-muted text-ivory font-semibold text-xs hover:border-sage/40 transition-colors"
          >
            Create Business Account
          </Link>
        </div>

        {/* Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-16 text-left w-full">
          <div className="bg-moss border border-olive-muted rounded-xl p-5 sm:p-6 shadow-card">
            <div className="w-9 h-9 rounded-lg bg-olive/60 flex items-center justify-center text-sage mb-4 border border-olive-muted">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-ivory mb-1.5">30-Day Liquidity Forecast</h3>
            <p className="text-xs text-gray-soft leading-relaxed">
              Deterministic daily cash trajectory mapping contractual vendor dues against realistic customer collection schedules adjusted for empirical delay patterns.
            </p>
          </div>

          <div className="bg-moss border border-olive-muted rounded-xl p-5 sm:p-6 shadow-card">
            <div className="w-9 h-9 rounded-lg bg-olive/60 flex items-center justify-center text-champagne mb-4 border border-olive-muted">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-ivory mb-1.5">Payment Behaviour Intelligence</h3>
            <p className="text-xs text-gray-soft leading-relaxed">
              Transparent 0-100 reliability scoring evaluating on-time payment ratio, average delay days, and overdue exposure to identify high-risk buyers before cash is trapped.
            </p>
          </div>

          <div className="bg-moss border border-olive-muted rounded-xl p-5 sm:p-6 shadow-card">
            <div className="w-9 h-9 rounded-lg bg-olive/60 flex items-center justify-center text-amber mb-4 border border-olive-muted">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-ivory mb-1.5">What-If Stress Simulator</h3>
            <p className="text-xs text-gray-soft leading-relaxed">
              Stress-test the impact when a top debtor delays 15 or 30 days, suppliers hike prices 20%, or an unexpected ₹50,000 expense strikes—without altering baseline records.
            </p>
          </div>
        </div>

        {/* Reality Check Callout */}
        <div className="mt-12 sm:mt-16 bg-moss border border-olive-muted rounded-xl p-6 sm:p-8 text-left max-w-4xl w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-card">
          <div className="max-w-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-champagne">
              Accounting Profit vs Real Liquidity
            </span>
            <h4 className="text-base sm:text-lg font-bold text-ivory mt-1">
              Why do profitable enterprises face sudden liquidity crunches?
            </h4>
            <p className="text-xs text-gray-soft mt-2 leading-relaxed">
              Accrual accounting recognizes revenue the moment an invoice is created, not when cash clears the bank account. MSME CashFlow Guardian bridges the survival gap between booked accounting profits and actual spendable cash.
            </p>
          </div>
          <button
            onClick={handleLaunchSample}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-olive/70 border border-champagne/30 text-champagne hover:bg-champagne/10 text-xs font-semibold tracking-wide transition-colors"
          >
            Explore Live Sample
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-olive-muted py-6 text-center text-[11px] text-gray-soft">
        <p>MSME CashFlow Guardian • Graphite Noir Edition • Engineered for Indian MSMEs (₹ INR)</p>
      </footer>
    </div>
  );
}
