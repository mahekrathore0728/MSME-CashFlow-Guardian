import React, { useState, useEffect } from 'react';
import { Building2, AlertCircle, Clock, ChevronRight, RefreshCw, Calendar } from 'lucide-react';
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ivory">Supplier Obligations & Payables</h1>
          <p className="text-xs text-gray-soft mt-1">
            Contractual payment maturities across 7, 15, and 30-day operational planning windows
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-gray-soft">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sage mb-2" />
          Auditing supplier commitments...
        </div>
      ) : suppliers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No suppliers or trade payables recorded"
          description="Enter vendor purchase bills or load the Sharma & Co. demo dataset to inspect scheduled trade payables."
        />
      ) : (
        <div className="space-y-6">
          {/* Suppliers Summary Table */}
          <div className="bg-moss border border-olive-muted rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-olive-muted bg-olive/30 text-gray-soft font-semibold uppercase tracking-wider text-[10px]">
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
                  {suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-olive/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-ivory">
                        <div>{s.name}</div>
                        <div className="text-[10px] text-gray-soft">{s.contact_email || s.contact_phone || 'Direct Trade'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-soft">
                        <span className="px-2 py-0.5 rounded bg-olive border border-olive-muted text-[10px]">
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

          {/* Detailed Bills Schedule */}
          <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card">
            <h3 className="text-base font-semibold text-ivory mb-1">
              Contractual Bills Ledger
            </h3>
            <p className="text-xs text-gray-soft mb-4">
              Contractual due dates are preserved exactly without synthetic date shifting. Overdue obligations are prioritized for immediate settlement.
            </p>

            <div className="overflow-x-auto">
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
                  {suppliers.flatMap(s => s.invoices.map(inv => ({ ...inv, supplier_name: s.name }))).map((bill) => (
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
                      <td className="py-2.5 px-3 text-right tabular-nums text-sage font-medium">{formatINR(bill.paid_amount)}</td>
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
      )}
    </div>
  );
}
