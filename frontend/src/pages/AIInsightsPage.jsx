import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PhoneCall,
  Calendar,
  Layers,
  RefreshCw,
  Info
} from 'lucide-react';
import api from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { formatINR } from '../utils/currency';

export function AIInsightsPage() {
  const { activeBusiness } = useBusiness();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/insights');
      setInsights(res.data);
    } catch (err) {
      console.error("Failed to load AI insights", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusiness) {
      fetchInsights();
    }
  }, [activeBusiness]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-gray-soft">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sage mb-2" />
        Synthesizing working capital action plans & risk commentary...
      </div>
    );
  }

  if (!insights) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No financial records to analyze"
        description="Populate your ledger or load the Sharma & Co. demo dataset to receive tactical cashflow action plans."
      />
    );
  }

  const { headline, summary_statement, main_risks, customer_followups, upcoming_obligations, tactical_action_plans, source, is_ai_generated, note } = insights;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ivory">AI Financial Action Plan</h1>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              is_ai_generated ? 'bg-sage/15 text-sage border-sage/30' : 'bg-olive text-champagne border-champagne/30'
            }`}>
              {is_ai_generated ? "Google Gemini Intelligence" : "Deterministic Rule Advisory Engine"}
            </span>
          </div>
          <p className="text-xs text-gray-soft mt-1">
            Empirical working capital diagnostics, collection priorities, and operational playbooks
          </p>
        </div>

        <button
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-olive border border-olive-muted text-ivory hover:border-sage/40 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Regenerate Insights</span>
        </button>
      </div>

      {note && (
        <div className="p-3 rounded-xl bg-olive border border-champagne/30 text-champagne text-xs flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{note}</span>
        </div>
      )}

      {/* Executive Summary Card */}
      <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-olive text-sage">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-ivory">{headline}</h2>
        </div>
        <p className="text-sm text-gray-soft leading-relaxed pl-1">
          {summary_statement}
        </p>
      </div>

      {/* Key Financial Risks & Actionable Remedies */}
      {main_risks && main_risks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-soft uppercase tracking-wider">
            Critical Liquidity Vulnerabilities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {main_risks.map((risk, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border shadow-card ${
                  risk.severity === 'CRITICAL' ? 'bg-crimson/5 border-crimson/30' : (risk.severity === 'WARNING' ? 'bg-amber/5 border-amber/30' : 'bg-moss border-olive-muted')
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-ivory">{risk.title}</h4>
                  <StatusBadge status={risk.severity} size="xs" />
                </div>
                <p className="text-xs text-gray-soft leading-relaxed mb-3">{risk.detail}</p>
                <div className="p-3 rounded-xl bg-olive/60 border border-olive-muted/60 text-xs text-ivory">
                  <span className="font-semibold text-sage">Recommended Remedy: </span>
                  <span>{risk.remedy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Customer Follow-ups Table */}
      {customer_followups && customer_followups.length > 0 && (
        <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card">
          <h3 className="text-base font-semibold text-ivory mb-1">
            Prioritized Customer Collection Roster
          </h3>
          <p className="text-xs text-gray-soft mb-4">
            Accounts requiring immediate contact based on overdue volume and chronic delay scores
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-olive-muted text-gray-soft font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Overdue Dues</th>
                  <th className="py-2.5 px-3 text-right">Total Outstanding</th>
                  <th className="py-2.5 px-3 text-center">Reliability</th>
                  <th className="py-2.5 px-3">Recommended Collection Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-muted/60">
                {customer_followups.map((c, idx) => (
                  <tr key={idx} className="hover:bg-olive/40 transition-colors">
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.priority === 'HIGH' ? 'bg-crimson/15 text-crimson' : 'bg-amber/15 text-amber'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-ivory">{c.customer_name}</td>
                    <td className="py-3 px-3 text-right font-bold text-crimson tabular-nums">
                      {formatINR(c.overdue_amount)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-ivory">
                      {formatINR(c.total_outstanding)}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      {c.reliability_score ? `${c.reliability_score}/100` : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-gray-soft max-w-md">{c.recommended_action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Concrete 7-Day, 15-Day, and 30-Day Tactical Playbooks */}
      {tactical_action_plans && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-soft uppercase tracking-wider">
            Operational Liquidity Action Playbook
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 7-Day Plan */}
            <div className="bg-moss border border-sage/30 rounded-2xl p-5 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-olive-muted">
                  <span className="w-6 h-6 rounded-lg bg-sage/15 text-sage flex items-center justify-center font-bold text-xs">
                    7
                  </span>
                  <h4 className="text-sm font-bold text-ivory">7-Day Urgent Sprint</h4>
                </div>
                <ul className="space-y-2.5 text-xs text-gray-soft">
                  {tactical_action_plans.seven_day_plan.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sage flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 15-Day Plan */}
            <div className="bg-moss border border-olive-muted rounded-2xl p-5 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-olive-muted">
                  <span className="w-6 h-6 rounded-lg bg-olive text-champagne flex items-center justify-center font-bold text-xs">
                    15
                  </span>
                  <h4 className="text-sm font-bold text-ivory">15-Day Horizon</h4>
                </div>
                <ul className="space-y-2.5 text-xs text-gray-soft">
                  {tactical_action_plans.fifteen_day_plan.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-champagne flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 30-Day Plan */}
            <div className="bg-moss border border-olive-muted rounded-2xl p-5 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-olive-muted">
                  <span className="w-6 h-6 rounded-lg bg-olive text-gray-soft flex items-center justify-center font-bold text-xs">
                    30
                  </span>
                  <h4 className="text-sm font-bold text-ivory">30-Day Structural Policy</h4>
                </div>
                <ul className="space-y-2.5 text-xs text-gray-soft">
                  {tactical_action_plans.thirty_day_plan.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gray-soft flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
