import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle, ArrowUpRight, ChevronRight, RefreshCw, UserCheck } from 'lucide-react';
import api from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { formatINR } from '../utils/currency';

export function CustomersPage() {
  const { activeBusiness } = useBusiness();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ivory">Customer Payment Intelligence</h1>
          <p className="text-xs text-gray-soft mt-1">
            Empirical reliability scoring based on payment delays, on-time frequency, and overdue exposure
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-gray-soft">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sage mb-2" />
          Analyzing customer payment behavior...
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customer accounts found"
          description="Record sales invoices or load the Sharma & Co. demo dataset to inspect empirical reliability scoring."
        />
      ) : (
        <div className="bg-moss border border-olive-muted rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-olive-muted bg-olive/30 text-gray-soft font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4 text-center">Reliability Score</th>
                  <th className="py-3 px-4 text-center">Risk Classification</th>
                  <th className="py-3 px-4 text-center">Avg Payment Delay</th>
                  <th className="py-3 px-4 text-right">Total Outstanding</th>
                  <th className="py-3 px-4 text-right">Overdue Dues</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-muted/60">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="hover:bg-olive/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-semibold text-ivory">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-gray-soft">{c.contact_email || c.contact_phone || 'Terms: 30 days'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {c.has_sufficient_history ? (
                        <div className="inline-flex items-center gap-1 font-bold text-sm tabular-nums">
                          <span className={c.reliability_score >= 80 ? 'text-sage' : (c.reliability_score >= 60 ? 'text-amber' : 'text-crimson')}>
                            {c.reliability_score}
                          </span>
                          <span className="text-[10px] text-gray-soft">/100</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-soft italic">Insufficient Data</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={c.risk_tier} label={c.risk_label} size="xs" />
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono">
                      {c.has_sufficient_history ? (
                        <span className={c.average_delay_days > 15 ? 'text-crimson font-semibold' : (c.average_delay_days > 5 ? 'text-amber' : 'text-sage')}>
                          {c.average_delay_days > 0 ? `+${c.average_delay_days} days late` : `${Math.abs(c.average_delay_days)} days early`}
                        </span>
                      ) : (
                        <span className="text-gray-soft">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-ivory tabular-nums">
                      {formatINR(c.total_outstanding)}
                    </td>

                    <td className={`py-3.5 px-4 text-right font-bold tabular-nums ${c.total_overdue > 0 ? 'text-crimson' : 'text-gray-soft'}`}>
                      {formatINR(c.total_overdue)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="text-sage font-medium text-xs flex items-center justify-center gap-1">
                        <span>Ledger</span>
                        <ChevronRight className="w-3.5 h-3.5" />
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
  );
}
