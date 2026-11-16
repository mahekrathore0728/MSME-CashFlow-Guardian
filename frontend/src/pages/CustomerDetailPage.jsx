import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Info,
  Building,
  FileText
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/dates';

export function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/customers/${id}`);
        setCustomer(res.data);
      } catch (err) {
        console.error("Failed to fetch customer detail", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-gray-soft">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sage mb-2" />
        Retrieving debtor ledger and empirical scoring metrics...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-20 text-gray-soft text-sm">
        Customer record not found. <Link to="/customers" className="text-sage underline">Return to Customers</Link>
      </div>
    );
  }

  const { formula_breakdown } = customer;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Back button & Title */}
      <div>
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-xs text-gray-soft hover:text-ivory transition-colors mb-3 px-2.5 py-1 rounded-md bg-olive/50 border border-olive-muted"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customer Directory</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ivory">{customer.name}</h1>
              <StatusBadge status={customer.risk_tier} label={customer.risk_label} />
            </div>
            <p className="text-xs text-gray-soft mt-1">
              {customer.contact_email || 'No email registered'} • {customer.contact_phone || 'No direct phone'} • Credit Term: {customer.payment_terms_days} days
            </p>
          </div>

          <div className="flex items-center gap-4 bg-moss border border-olive-muted rounded-xl p-3 px-5 shadow-card self-start sm:self-auto">
            <div className="text-right">
              <p className="text-[10px] text-gray-soft uppercase font-semibold tracking-wider">Reliability Score</p>
              <div className="text-2xl font-bold text-ivory tabular-nums">
                {customer.has_sufficient_history ? (
                  <span className={customer.reliability_score >= 80 ? 'text-emerald' : (customer.reliability_score >= 60 ? 'text-amber' : 'text-crimson')}>
                    {customer.reliability_score}
                  </span>
                ) : (
                  <span className="text-sm text-gray-soft font-normal">N/A</span>
                )}
                <span className="text-xs text-gray-soft font-normal"> / 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        <div className="bg-moss border border-olive-muted rounded-xl p-4 sm:p-5 shadow-card">
          <span className="text-xs text-gray-soft uppercase tracking-wider font-medium">Total Invoiced</span>
          <p className="text-xl font-bold text-ivory mt-1">{formatINR(customer.total_invoiced)}</p>
          <span className="text-[10px] text-gray-soft">{customer.total_invoices_count} commercial invoices issued</span>
        </div>

        <div className="bg-moss border border-olive-muted rounded-xl p-4 sm:p-5 shadow-card">
          <span className="text-xs text-gray-soft uppercase tracking-wider font-medium">Total Collected</span>
          <p className="text-xl font-bold text-emerald mt-1">{formatINR(customer.total_collected)}</p>
          <span className="text-[10px] text-gray-soft">Settled funds realized</span>
        </div>

        <div className="bg-moss border border-olive-muted rounded-xl p-4 sm:p-5 shadow-card">
          <span className="text-xs text-gray-soft uppercase tracking-wider font-medium">Outstanding Dues</span>
          <p className="text-xl font-bold text-ivory mt-1">{formatINR(customer.total_outstanding)}</p>
          <span className="text-[10px] text-gray-soft">Active uncollected balance</span>
        </div>

        <div className="bg-moss border border-olive-muted rounded-xl p-4 sm:p-5 shadow-card">
          <span className="text-xs text-crimson uppercase tracking-wider font-medium">Overdue Dues</span>
          <p className="text-xl font-bold text-crimson mt-1">{formatINR(customer.total_overdue)}</p>
          <span className="text-[10px] text-gray-soft">{customer.overdue_invoices_count} overdue invoices</span>
        </div>
      </div>

      {/* Transparent Reliability Scoring Breakdown Card */}
      <div className="bg-moss border border-olive-muted rounded-xl p-5 sm:p-6 shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm sm:text-base font-semibold text-ivory">
            Deterministic Reliability Score Breakdown
          </h3>
        </div>
        <p className="text-xs text-gray-soft mb-4">
          Empirically evaluated by the Python backend scoring engine across historical payment timings:
        </p>

        {customer.has_sufficient_history && formula_breakdown ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs tabular-nums">
            <div className="p-3.5 rounded-lg bg-olive/40 border border-olive-muted">
              <span className="text-[10px] text-gray-soft uppercase font-semibold">On-Time Ratio (40%)</span>
              <p className="text-lg font-bold text-emerald mt-1">+{formula_breakdown.on_time_component} pts</p>
              <p className="text-[10px] text-gray-soft mt-1">Invoices settled on or before due date</p>
            </div>

            <div className="p-3.5 rounded-lg bg-olive/40 border border-olive-muted">
              <span className="text-[10px] text-gray-soft uppercase font-semibold">Delay Factor (30%)</span>
              <p className="text-lg font-bold text-ivory mt-1">+{formula_breakdown.delay_component} pts</p>
              <p className="text-[10px] text-gray-soft mt-1">Average delay: +{customer.average_delay_days} days</p>
            </div>

            <div className="p-3.5 rounded-lg bg-olive/40 border border-olive-muted">
              <span className="text-[10px] text-gray-soft uppercase font-semibold">Payment Consistency (15%)</span>
              <p className="text-lg font-bold text-ivory mt-1">+{formula_breakdown.frequency_component} pts</p>
              <p className="text-[10px] text-gray-soft mt-1">Consistency across settlement portions</p>
            </div>

            <div className="p-3.5 rounded-lg bg-olive/40 border border-olive-muted">
              <span className="text-[10px] text-gray-soft uppercase font-semibold">Overdue Ratio (15%)</span>
              <p className="text-lg font-bold text-ivory mt-1">+{formula_breakdown.overdue_component} pts</p>
              <p className="text-[10px] text-gray-soft mt-1">Past-due dues vs total invoiced</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-olive/40 border border-olive-muted text-xs text-gray-soft flex items-start sm:items-center gap-3">
            <Info className="w-5 h-5 text-amber flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-semibold text-ivory">Insufficient Payment History (Cold Start Guard)</p>
              <p className="text-[11px] text-gray-soft mt-0.5 leading-relaxed">
                The scoring model requires at least 2 settled invoice portions to establish an empirical payment baseline. This intentional protection prevents premature risk classification of new enterprise customers.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Customer Invoices Ledger */}
      <div className="bg-moss border border-olive-muted rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-olive-muted bg-olive/40">
          <h3 className="text-sm font-semibold text-ivory">Customer Invoices Ledger</h3>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-olive-muted text-gray-soft font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Issue Date</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4 text-right">Billed Amount</th>
                  <th className="py-2.5 px-4 text-right">Settled Amount</th>
                  <th className="py-2.5 px-4 text-right">Outstanding</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-muted/60">
                {customer.invoices && customer.invoices.length > 0 ? (
                  customer.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-olive/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-ivory">{inv.invoice_number}</td>
                      <td className="py-3 px-4 text-gray-soft">{formatDate(inv.issue_date)}</td>
                      <td className="py-3 px-4 text-gray-soft">
                        <span>{formatDate(inv.due_date)}</span>
                        {inv.is_overdue && (
                          <span className="ml-2 text-[10px] text-crimson font-medium">(Overdue)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-ivory tabular-nums">{formatINR(inv.total_amount)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald tabular-nums">{formatINR(inv.paid_amount)}</td>
                      <td className="py-3 px-4 text-right font-bold text-ivory tabular-nums">{formatINR(inv.outstanding_amount)}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={inv.status} size="xs" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-soft">
                      No invoices recorded for this customer yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
