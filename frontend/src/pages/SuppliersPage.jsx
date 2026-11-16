import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  AlertCircle,
  Clock,
  RefreshCw,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/dates';

export function SuppliersPage() {
  const { activeBusiness } = useBusiness();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [horizonFilter, setHorizonFilter] = useState('');

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      console.error("Failed to load suppliers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusiness) {
      fetchSuppliers();
    }
  }, [activeBusiness]);

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.category && s.category.toLowerCase().includes(search.toLowerCase()));
    let matchesHorizon = true;
    if (horizonFilter === '7') matchesHorizon = s.due_next_7_days > 0;
    else if (horizonFilter === '15') matchesHorizon = s.due_next_15_days > 0;
    else if (horizonFilter === 'overdue') matchesHorizon = s.total_overdue > 0;
    return matchesSearch && matchesHorizon;
  });

  const totalOutstandingAll = suppliers.reduce((acc, s) => acc + (parseFloat(s.total_outstanding) || 0), 0);
  const dueNext7DaysAll = suppliers.reduce((acc, s) => acc + (parseFloat(s.due_next_7_days) || 0), 0);
  const totalOverdueAll = suppliers.reduce((acc, s) => acc + (parseFloat(s.total_overdue) || 0), 0);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ivory">
            Supplier Obligations & Payables
          </h1>
          <p className="text-xs text-gray-soft mt-1">
            Contractual payment maturities mapped across 7, 15, and 30-day operational planning windows
          </p>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 tabular-nums">
        <div className="p-4 rounded-xl bg-[#202327] border border-[#383D43] shadow-card">
          <span className="text-xs text-[#A0A5AC] uppercase font-medium tracking-wider">Total Trade Payables</span>
          <p className="text-xl font-bold text-[#F1F2F3] mt-1">{formatINR(totalOutstandingAll)}</p>
          <span className="text-[10px] text-[#A0A5AC]">Across {suppliers.length} active trade vendors</span>
        </div>

        <div className="p-4 rounded-xl bg-[#202327] border border-[#383D43] shadow-card">
          <span className="text-xs text-[#C9A875] uppercase font-medium tracking-wider">Maturity Next 7 Days</span>
          <p className="text-xl font-bold text-[#C9A875] mt-1">{formatINR(dueNext7DaysAll)}</p>
          <span className="text-[10px] text-[#A0A5AC]">Immediate operational cash obligations</span>
        </div>

        <div className="p-4 rounded-xl bg-[#202327] border border-[#383D43] shadow-card">
          <span className="text-xs text-[#C77F83] uppercase font-medium tracking-wider">Past Due / Overdue</span>
          <p className="text-xl font-bold text-[#C77F83] mt-1">{formatINR(totalOverdueAll)}</p>
          <span className="text-[10px] text-[#A0A5AC]">Requires immediate vendor reconciliation</span>
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
            placeholder="Search vendor name, category, material..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#292D32] border border-[#383D43] text-xs text-[#F1F2F3] placeholder:text-[#A0A5AC]/50 focus:outline-none focus:border-[#8299AD] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={horizonFilter}
            onChange={(e) => setHorizonFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 rounded-lg bg-[#292D32] border border-[#383D43] text-xs text-[#F1F2F3] focus:outline-none focus:border-[#8299AD] transition-colors"
          >
            <option value="">All Maturities</option>
            <option value="7">Due Next 7 Days</option>
            <option value="15">Due Next 15 Days</option>
            <option value="overdue">Overdue Obligations</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-[#A0A5AC]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#8299AD] mb-2" />
          Auditing supplier commitments and maturities...
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No suppliers or trade payables recorded"
          description="Enter vendor purchase bills or load the Sharma & Co. sample dataset to inspect scheduled trade payables."
        />
      ) : (
        <div className="space-y-6">
          {/* Suppliers Summary Table */}
          <div className="bg-[#202327] border border-[#383D43] rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#383D43] bg-[#292D32] text-[#A0A5AC] font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Supplier / Vendor</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Outstanding Total</th>
                      <th className="py-3 px-4 text-right">Due Next 7 Days</th>
                      <th className="py-3 px-4 text-right">Due Next 15 Days</th>
                      <th className="py-3 px-4 text-right">Overdue Bills</th>
                      <th className="py-3 px-4 text-center">Payment Terms</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-olive-muted/60">
                    {filteredSuppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-olive/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-ivory">
                          <div>{s.name}</div>
                          <div className="text-[10px] text-gray-soft font-normal">
                            {s.contact_email || s.contact_phone || 'Direct Trade'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-gray-soft">
                          <span className="px-2 py-0.5 rounded bg-olive/60 border border-olive-muted text-[10px]">
                            {s.category || 'Vendor'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-ivory tabular-nums">
                          {formatINR(s.total_outstanding)}
                        </td>

                        <td className={`py-3.5 px-4 text-right font-semibold tabular-nums ${s.due_next_7_days > 0 ? 'text-amber' : 'text-gray-soft'}`}>
                          {formatINR(s.due_next_7_days)}
                        </td>

                        <td className="py-3.5 px-4 text-right tabular-nums text-ivory font-medium">
                          {formatINR(s.due_next_15_days)}
                        </td>

                        <td className={`py-3.5 px-4 text-right font-bold tabular-nums ${s.total_overdue > 0 ? 'text-crimson' : 'text-gray-soft'}`}>
                          {formatINR(s.total_overdue)}
                        </td>

                        <td className="py-3.5 px-4 text-center text-gray-soft font-mono">
                          {s.payment_terms_days} days net
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Detailed Bills Schedule */}
          <div className="bg-moss border border-olive-muted rounded-xl p-5 sm:p-6 shadow-card">
            <h3 className="text-sm sm:text-base font-semibold text-ivory mb-1">
              Contractual Bills Ledger
            </h3>
            <p className="text-xs text-gray-soft mb-4">
              Contractual vendor obligations mapped to actual calendar maturity dates. Overdue obligations are prioritized for immediate settlement.
            </p>

            <div className="overflow-x-auto -mx-5 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-5 sm:px-0">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-olive-muted text-gray-soft font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Bill Number</th>
                      <th className="py-2.5 px-3">Supplier</th>
                      <th className="py-2.5 px-3">Issue Date</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Total Billed</th>
                      <th className="py-2.5 px-3 text-right">Paid Amount</th>
                      <th className="py-2.5 px-3 text-right">Outstanding</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-olive-muted/60">
                    {filteredSuppliers.flatMap(s => s.invoices.map(inv => ({ ...inv, supplier_name: s.name }))).map((bill) => (
                      <tr key={bill.id} className="hover:bg-olive/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-ivory">{bill.invoice_number}</td>
                        <td className="py-2.5 px-3 font-medium text-ivory">{bill.supplier_name}</td>
                        <td className="py-2.5 px-3 text-gray-soft">{formatDate(bill.issue_date)}</td>
                        <td className="py-2.5 px-3 text-gray-soft">
                          {formatDate(bill.due_date)}
                          {bill.is_overdue && (
                            <span className="text-crimson font-medium ml-1.5">({bill.days_overdue}d overdue)</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-ivory">{formatINR(bill.total_amount)}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-emerald font-medium">{formatINR(bill.paid_amount)}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold text-ivory">{formatINR(bill.outstanding_amount)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <StatusBadge status={bill.status} size="xs" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
