import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Calendar, AlertTriangle, CheckCircle2, RefreshCw, Clock } from 'lucide-react';
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
      <div className="py-20 text-center text-xs text-gray-soft">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sage mb-2" />
        Loading customer ledger and scoring metrics...
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back button & Title */}
      <div>
        <Link to="/customers" className="inline-flex items-center gap-1.5 text-xs text-gray-soft hover:text-sage transition-colors mb-3">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customers</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-ivory">{customer.name}</h1>
              <StatusBadge status={customer.risk_tier} label={customer.risk_label} />
            </div>
            <p className="text-xs text-gray-soft mt-1">
              {customer.contact_email || 'No email'} • {customer.contact_phone || 'No phone'} • Contractual Terms: {customer.payment_terms_days} days
            </p>
          </div>

          <div className="flex items-center gap-4 bg-moss border border-olive-muted rounded-xl p-3 px-5 shadow-card">
            <div className="text-right">
              <p className="text-[10px] text-gray-soft uppercase font-semibold">Reliability Score</p>
              <div className="text-2xl font-bold text-ivory tabular-nums">
                {customer.has_sufficient_history ? (
                  <span className={customer.reliability_score >= 80 ? 'text-sage' : (customer.reliability_score >= 60 ? 'text-amber' : 'text-crimson')}>
                    {customer.reliability_score}
                  </span>
                ) : (
                  <span className="text-sm text-gray-soft">N/A</span>
                )}
                <span className="text-xs text-gray-soft font-normal"> / 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        <div className="bg-moss border border-olive-muted rounded-xl p-4 shadow-card">
          <span className="text-xs text-gray-soft">Total Invoiced</span>
          <p className="text-xl font-bold text-ivory mt-1">{formatINR(customer.total_invoiced)}</p>
          <span className="text-[10px] text-gray-soft">{customer.total_invoices_count} invoices issued</span>
        </div>

        <div className="bg-moss border border-olive-muted rounded-xl p-4 shadow-card">
          <span className="text-xs text-gray-soft">Total Collected</span>
          <p className="text-xl font-bold text-sage mt-1">{formatINR(customer.total_collected)}</p>
          <span className="text-[10px] text-gray-soft">Settled funds received</span>
        </div>

        <div className="bg-moss border border-olive-muted rounded-xl p-4 shadow-card">
          <span className="text-xs text-gray-soft">Outstanding Dues</span>
          <p className="text-xl font-bold text-ivory mt-1">{formatINR(customer.total_outstanding)}</p>
          <span className="text-[10px] text-gray-soft">Current accounts receivable</span>
        </div>

        <div className="bg-moss border border-olive-muted rounded-xl p-4 shadow-card">
          <span className="text-xs text-crimson font-medium">Overdue Balance</span>
          <p className="text-xl font-bold text-crimson mt-1">{formatINR(customer.total_overdue)}</p>
          <span className="text-[10px] text-gray-soft">{customer.overdue_invoices_count} overdue invoices</span>
        </div>
      </div>

      {/* Transparent Reliability Scoring Breakdown Card */}
      <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card">
        <h3 className="text-base font-semibold text-ivory mb-1">
          Deterministic Reliability Score Model
        </h3>
        <p className="text-xs text-gray-soft mb-4">
          Calculated by the Python backend scoring engine using weighted payment history factors:
        </p>

        {customer.has_sufficient_history && formula_breakdown ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs tabular-nums">
            <div className="p-3.5 rounded-xl bg-olive border border-olive-muted">
              <span className="text-[10px] text-gray-soft uppercase font-semibold">On-Time Ratio (40%)</span>
              <p className="text-lg font-bold text-sage mt-1">+{formula_breakdown.on_time_component} pts</p>
              <p className="text-[10px] text-gray-soft mt-1">Invoices settled on or before due date</p>
            </div>

            <div className="p-3.5 rounded-xl bg-olive border border-olive-muted">
              <span className="text-[10px] text-gray-soft uppercase font-semibold">Delay Factor (30%)</span>
              <p className="text-lg font-bold text-ivory mt-1">+{formula_breakdown.delay_component} pts</p>
              <p className="text-[10px] text-gray-soft mt-1">Avg delay: {customer.average_delay_days} days</p>
            </div>

            <div className="p-3.5 rounded-xl bg-olive border border-olive-muted">
              <span className="text-[10px] text-gray-soft uppercase font-semibold">Frequency (15%)</span>
              <p className="text-lg font-bold text-ivory mt-1">+{formula_breakdown.frequency_component} pts</p>
              <p className="text-[10px] text-gray-soft mt-1">Consistency across payment events</p>
            </div>

            <div className="p-3.5 rounded-xl bg-olive border border-olive-muted">
              <span className="text-[10px] text-gray-soft uppercase font-semibold">Overdue Ratio (15%)</span>
              <p className="text-lg font-bold text-ivory mt-1">+{formula_breakdown.overdue_component} pts</p>
              <p className="text-[10px] text-gray-soft mt-1">Overdue as ratio of total invoiced</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-olive border border-olive-muted text-xs text-gray-soft flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber flex-shrink-0" />
            <span>{customer.message}</span>
          </div>
        )}
      </div>

      {/* Customer Invoices Ledger */}
      <div className="bg-moss border border-olive-muted rounded-2xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-olive-muted bg-olive/30">
          <h3 className="text-sm font-semibold text-ivory">Invoices Ledger</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-olive-muted text-gray-soft font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Paid Amount</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-olive-muted/60">
              {customer.invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-olive/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-ivory">{inv.invoice_number}</td>
                  <td className="py-3 px-4 text-gray-soft">{formatDate(inv.issue_date)}</td>
                  <td className="py-3 px-4 text-gray-soft">
                    {formatDate(inv.due_date)}
                    {inv.is_overdue && (
                      <span className="text-crimson font-medium ml-1.5">(Overdue)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-semibold text-ivory">
                    {formatINR(inv.total_amount)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-sage font-medium">
                    {formatINR(inv.paid_amount)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-bold text-ivory">
                    {formatINR(inv.outstanding_amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={inv.status} size="xs" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
