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
  Info,
  ArrowRight,
  Shield
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
      console.error("Failed to load financial insights", err);
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
      <div className="py-24 text-center text-xs text-gray-soft">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sage mb-2" />
        Synthesizing working capital action plans & risk diagnostics...
      </div>
    );
  }

  if (!insights) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No financial records to analyze"
        description="Populate your ledger or load the Sharma & Co. sample dataset to receive tactical cashflow action plans."
      />
    );
  }

  const { headline, summary_statement, main_risks, customer_followups, upcoming_obligations, tactical_action_plans, source, is_ai_generated, note } = insights;

  const criticalRisks = (main_risks || []).filter(r => r.severity === 'CRITICAL');
  const warningRisks = (main_risks || []).filter(r => r.severity === 'WARNING');
  const otherRisks = (main_risks || []).filter(r => r.severity !== 'CRITICAL' && r.severity !== 'WARNING');

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ivory">
              Financial Intelligence Action Plan
            </h1>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
              is_ai_generated
                ? 'bg-sage/10 text-sage border-sage/25'
                : 'bg-olive/60 text-champagne border-olive-muted'
            }`}>
              {is_ai_generated ? "Google Gemini Intelligence" : "Deterministic Advisory Engine"}
            </span>
          </div>
          <p className="text-xs text-gray-soft mt-1">
            Empirical working capital diagnostics, collection priorities, and operational mitigation playbooks
          </p>
        </div>

        <button
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-olive/50 border border-olive-muted text-ivory hover:border-sage/40 text-xs font-semibold transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Regenerate Insights</span>
        </button>
      </div>

      {note && (
        <div className="p-3.5 rounded-xl bg-moss border border-olive-muted text-gray-soft text-xs flex items-center gap-2.5 shadow-subtle">
          <Info className="w-4 h-4 text-sage flex-shrink-0" />
          <span className="leading-relaxed">{note}</span>
        </div>
      )}

      {/* Executive Summary Card */}
      <div className="bg-moss border border-olive-muted rounded-xl p-5 sm:p-6 shadow-card">
        <div className="flex items-center gap-2.5 mb-2.5">
          <Shield className="w-4 h-4 text-sage" />
          <h2 className="text-sm sm:text-base font-semibold text-ivory">{headline}</h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-soft leading-relaxed">
          {summary_statement}
        </p>
      </div>

      {/* Key Financial Risks & Actionable Remedies */}
      {main_risks && main_risks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-soft uppercase tracking-wider">
            Identified Working Capital Vulnerabilities
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Critical Risks */}
            {criticalRisks.map((risk, idx) => (
              <div
                key={`crit-${idx}`}
                className="p-5 rounded-xl border border-l-4 border-l-crimson border-crimson/25 bg-moss shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs sm:text-sm font-semibold text-ivory">{risk.title}</h4>
                    <StatusBadge status="CRITICAL" label="Critical" size="xs" />
                  </div>
                  <p className="text-xs text-gray-soft leading-relaxed mb-3">{risk.detail}</p>
                </div>
                <div className="p-3 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory">
                  <span className="font-semibold text-crimson">Mitigation Step: </span>
                  <span className="text-gray-soft">{risk.remedy}</span>
                </div>
              </div>
            ))}

            {/* Warning Risks */}
            {warningRisks.map((risk, idx) => (
              <div
                key={`warn-${idx}`}
                className="p-5 rounded-xl border border-l-4 border-l-amber border-amber/25 bg-moss shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs sm:text-sm font-semibold text-ivory">{risk.title}</h4>
                    <StatusBadge status="WARNING" label="Warning" size="xs" />
                  </div>
                  <p className="text-xs text-gray-soft leading-relaxed mb-3">{risk.detail}</p>
                </div>
                <div className="p-3 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory">
                  <span className="font-semibold text-amber">Mitigation Step: </span>
                  <span className="text-gray-soft">{risk.remedy}</span>
                </div>
              </div>
            ))}

            {/* Other / Informational Risks */}
            {otherRisks.map((risk, idx) => (
              <div
                key={`other-${idx}`}
                className="p-5 rounded-xl border border-l-4 border-l-sage border-olive-muted bg-moss shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs sm:text-sm font-semibold text-ivory">{risk.title}</h4>
                    <StatusBadge status="LOW" label="Informational" size="xs" />
                  </div>
                  <p className="text-xs text-gray-soft leading-relaxed mb-3">{risk.detail}</p>
                </div>
                <div className="p-3 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory">
                  <span className="font-semibold text-sage">Actionable Step: </span>
                  <span className="text-gray-soft">{risk.remedy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Customer Follow-ups Table */}
      {customer_followups && customer_followups.length > 0 && (
        <div className="bg-moss border border-olive-muted rounded-xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-olive-muted bg-olive/40">
            <h3 className="text-xs sm:text-sm font-semibold text-ivory">
              Prioritized Customer Collection Roster
            </h3>
            <p className="text-xs text-gray-soft mt-0.5">
              Targeted recovery sequence prioritized by overdue exposure and payment reliability rating
            </p>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-olive-muted text-gray-soft font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-4">Priority</th>
                    <th className="py-2.5 px-4">Debtor Account</th>
                    <th className="py-2.5 px-4 text-right">Overdue Balance</th>
                    <th className="py-2.5 px-4 text-right">Total Outstanding</th>
                    <th className="py-2.5 px-4 text-center">Score</th>
                    <th className="py-2.5 px-4">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-olive-muted/60">
                  {customer_followups.map((c, idx) => (
                    <tr key={idx} className="hover:bg-olive/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          c.priority === 'HIGH' ? 'bg-crimson/15 text-crimson border border-crimson/25' : 'bg-amber/15 text-amber border border-amber/25'
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-ivory">{c.customer_name}</td>
                      <td className="py-3 px-4 text-right font-bold text-crimson tabular-nums">
                        {formatINR(c.overdue_amount)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-ivory">
                        {formatINR(c.total_outstanding)}
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums">
                        {c.reliability_score ? (
                          <span className={c.reliability_score >= 80 ? 'text-emerald' : (c.reliability_score >= 60 ? 'text-amber' : 'text-crimson')}>
                            {c.reliability_score}/100
                          </span>
                        ) : (
                          <span className="text-gray-soft text-[10px]">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-soft max-w-sm leading-relaxed">{c.recommended_action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Concrete 7-Day, 15-Day, and 30-Day Tactical Playbooks */}
      {tactical_action_plans && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-soft uppercase tracking-wider">
            Operational Liquidity Action Playbook
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 7-Day Plan */}
            <div className="bg-moss border border-olive-muted rounded-xl p-5 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-olive-muted/60">
                  <span className="w-5 h-5 rounded-md bg-sage/15 text-sage flex items-center justify-center font-bold text-[11px]">
                    7
                  </span>
                  <h4 className="text-xs sm:text-sm font-semibold text-ivory">7-Day Immediate Sprint</h4>
                </div>
                <ul className="space-y-2 text-xs text-gray-soft">
                  {tactical_action_plans.seven_day_plan.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sage flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 15-Day Plan */}
            <div className="bg-moss border border-olive-muted rounded-xl p-5 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-olive-muted/60">
                  <span className="w-5 h-5 rounded-md bg-olive text-champagne flex items-center justify-center font-bold text-[11px]">
                    15
                  </span>
                  <h4 className="text-xs sm:text-sm font-semibold text-ivory">15-Day Intermediate Horizon</h4>
                </div>
                <ul className="space-y-2 text-xs text-gray-soft">
                  {tactical_action_plans.fifteen_day_plan.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <CheckCircle2 className="w-3.5 h-3.5 text-champagne flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 30-Day Plan */}
            <div className="bg-moss border border-olive-muted rounded-xl p-5 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-olive-muted/60">
                  <span className="w-5 h-5 rounded-md bg-olive text-gray-soft flex items-center justify-center font-bold text-[11px]">
                    30
                  </span>
                  <h4 className="text-xs sm:text-sm font-semibold text-ivory">30-Day Structural Policy</h4>
                </div>
                <ul className="space-y-2 text-xs text-gray-soft">
                  {tactical_action_plans.thirty_day_plan.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
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
