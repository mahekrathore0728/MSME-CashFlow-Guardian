import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Info,
  Clock,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';
import api from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { formatINR } from '../utils/currency';

export function CustomersPage() {
  const { activeBusiness } = useBusiness();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error("Failed to load customers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusiness) {
      fetchCustomers();
    }
  }, [activeBusiness]);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.contact_email && c.contact_email.toLowerCase().includes(search.toLowerCase()));
    const matchesTier = !tierFilter || c.risk_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ivory">
              Customer Payment Intelligence
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-olive/60 border border-olive-muted text-gray-soft uppercase tracking-wider">
              Empirical Scoring (0-100)
            </span>
          </div>
          <p className="text-xs text-gray-soft mt-1">
            Deterministic reliability scoring based on payment delays, on-time frequency, and overdue exposure
          </p>
        </div>
      </div>

      {/* Scoring Methodology Banner */}
      <div className="p-4 rounded-xl bg-[#202327] border border-[#383D43] shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-[#A0A5AC]">
          <Info className="w-4 h-4 text-[#8299AD] flex-shrink-0" />
          <span>
            <strong className="text-[#F1F2F3]">Scoring Formula:</strong> 40% On-Time Ratio + 30% Delay Penalty + 15% Payment Consistency + 15% Overdue Ratio. Requires at least 2 completed settlement records.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] flex-shrink-0 text-[#A0A5AC]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#8DA995]" /> 80-100 Low
          <span className="inline-block w-2 h-2 rounded-full bg-[#C9A875] ml-2" /> 60-79 Moderate
          <span className="inline-block w-2 h-2 rounded-full bg-[#C77F83] ml-2" /> &lt;60 High
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#202327] border border-[#383D43] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-3 shadow-card">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#A0A5AC]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email or terms..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#292D32] border border-[#383D43] text-xs text-[#F1F2F3] placeholder:text-[#A0A5AC]/50 focus:outline-none focus:border-[#8299AD] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 rounded-lg bg-[#292D32] border border-[#383D43] text-xs text-[#F1F2F3] focus:outline-none focus:border-[#8299AD] transition-colors"
          >
            <option value="">All Risk Tiers</option>
            <option value="LOW">Low Risk (80-100)</option>
            <option value="MODERATE">Moderate Risk (60-79)</option>
            <option value="HIGH">High Risk (&lt;60)</option>
            <option value="INSUFFICIENT_HISTORY">Insufficient History</option>
          </select>
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="bg-[#202327] border border-[#383D43] rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-xs text-gray-soft">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sage mb-2" />
            Analyzing customer payment distributions...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customer accounts found"
            description="No customer records match your filter criteria. Issue sales invoices or reload the sample dataset to inspect empirical reliability scoring."
          />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-olive-muted bg-olive/40 text-gray-soft font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Customer Account</th>
                    <th className="py-3 px-4 text-center">Reliability Score</th>
                    <th className="py-3 px-4 text-center">Risk Classification</th>
                    <th className="py-3 px-4 text-center">Avg Payment Delay</th>
                    <th className="py-3 px-4 text-right">Total Outstanding</th>
                    <th className="py-3 px-4 text-right">Overdue Dues</th>
                    <th className="py-3 px-4 text-center">Ledger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-olive-muted/60">
                  {filteredCustomers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/customers/${c.id}`)}
                      className="hover:bg-olive/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-semibold text-ivory">
                        <div className="group-hover:text-sage transition-colors">{c.name}</div>
                        <div className="text-[10px] text-gray-soft font-normal">
                          {c.contact_email || c.contact_phone || `Standard Credit: ${c.payment_terms_days} days`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {c.has_sufficient_history ? (
                          <div className="inline-flex items-center gap-1 font-bold text-sm tabular-nums">
                            <span className={c.reliability_score >= 80 ? 'text-emerald' : (c.reliability_score >= 60 ? 'text-amber' : 'text-crimson')}>
                              {c.reliability_score}
                            </span>
                            <span className="text-[10px] text-gray-soft font-normal">/100</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-olive/60 border border-olive-muted text-[10px] text-gray-soft" title="Requires at least 2 settled payment portions to compute empirical score">
                            <span>Cold Start</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={c.risk_tier} label={c.risk_label} size="xs" />
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono">
                        {c.has_sufficient_history ? (
                          <span className={c.average_delay_days > 15 ? 'text-crimson font-semibold' : (c.average_delay_days > 5 ? 'text-amber' : 'text-emerald')}>
                            {c.average_delay_days > 0 ? `+${c.average_delay_days} days` : (c.average_delay_days === 0 ? 'On Time' : `${Math.abs(c.average_delay_days)}d early`)}
                          </span>
                        ) : (
                          <span className="text-gray-muted text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-ivory tabular-nums">
                        {formatINR(c.total_outstanding)}
                      </td>

                      <td className={`py-3.5 px-4 text-right font-bold tabular-nums ${c.total_overdue > 0 ? 'text-crimson' : 'text-gray-soft'}`}>
                        {formatINR(c.total_overdue)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="text-sage font-medium text-xs flex items-center justify-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <ChevronRight className="w-4 h-4 text-gray-soft group-hover:text-sage" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
