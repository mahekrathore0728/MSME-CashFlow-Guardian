import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Scale,
  Clock,
  ShieldCheck,
  ChevronRight,
  FileText,
  Building,
  RefreshCw,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid
} from 'recharts';

import api from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { AlertBanner } from '../components/common/AlertBanner';
import { EmptyState } from '../components/common/EmptyState';
import { formatINR, formatINRCompact } from '../utils/currency';
import { formatDate } from '../utils/dates';

export function DashboardPage() {
  const { activeBusiness, loadDemoData, demoLoading } = useBusiness();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/summary');
      setData(res.data);
    } catch (err) {
      setError("Failed to load dashboard financial intelligence.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [activeBusiness]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-sage">
        <div className="w-8 h-8 border-2 border-sage border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-soft font-mono">Calculating financial engine metrics...</span>
      </div>
    );
  }

  if (!data || !data.has_business) {
    return (
      <EmptyState
        title="No Business Configured"
        description="Establish your business baseline parameters or launch the Sharma & Co. demo dataset to inspect live financial intelligence."
        actionText="Load Demo Business Data"
        onAction={loadDemoData}
        secondaryActionText="Set Up New Business"
        onSecondaryAction={() => navigate('/setup')}
      />
    );
  }

  const { metrics, profit_vs_cash, cashflow_chart_data, customer_risk_summary, payables_summary, recent_transactions, alerts } = data;

  // Custom Recharts Tooltip for Midnight Luxe
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      return (
        <div className="bg-moss border border-olive-muted rounded-xl p-3.5 shadow-modal text-xs">
          <p className="font-semibold text-ivory mb-2 pb-1 border-b border-olive-muted">{label}</p>
          <div className="space-y-1.5 tabular-nums">
            <p className="text-sage flex justify-between gap-4">
              <span>Closing Balance:</span>
              <span className="font-bold">{formatINR(pData.closing_balance)}</span>
            </p>
            <p className="text-sage-hover flex justify-between gap-4">
              <span>Day Inflows:</span>
              <span>{formatINR(pData.inflows)}</span>
            </p>
            <p className="text-crimson flex justify-between gap-4">
              <span>Day Outflows:</span>
              <span>{formatINR(pData.outflows)}</span>
            </p>
            <p className="text-amber/90 flex justify-between gap-4 pt-1 border-t border-olive-muted/40">
              <span>Operating Reserve:</span>
              <span>{formatINR(pData.minimum_reserve)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-ivory">
              Executive Overview
            </h1>
            {data.business.is_demo && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-champagne/15 text-champagne border border-champagne/30 uppercase tracking-wider">
                Fictional Demo
              </span>
            )}
          </div>
          <p className="text-xs text-gray-soft mt-1">
            Real-time cash position, customer payment reliability & 30-day liquidity outlook
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/transactions"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sage text-midnight font-bold text-xs tracking-wide hover:bg-sage-hover transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Transaction</span>
          </Link>
          <Link
            to="/forecast"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-olive border border-olive-muted text-ivory font-semibold text-xs hover:border-sage/40 transition-colors"
          >
            <span>Inspect 30-Day Forecast</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Critical Liquidity Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, idx) => (
            <AlertBanner
              key={idx}
              type={alert.type}
              title={alert.title}
              message={alert.message}
              actionText={alert.type === 'CRITICAL' ? 'Run Stress Simulation' : 'Inspect Details'}
              onAction={() => navigate(alert.type === 'CRITICAL' ? '/stress-simulator' : '/forecast')}
            />
          ))}
        </div>
      )}

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Cash Balance"
          value={formatINR(metrics.current_cash_balance)}
          subtitle="Reconciled from physical transactions"
          icon={Wallet}
          accentColor="sage"
          onClick={() => navigate('/transactions')}
        />

        <MetricCard
          title="Total Receivables"
          value={formatINR(metrics.total_receivables)}
          subtitle={
            metrics.total_overdue_receivables > 0
              ? `${formatINR(metrics.total_overdue_receivables)} overdue`
              : "All customer dues are current"
          }
          icon={ArrowDownLeft}
          badge={metrics.total_overdue_receivables > 0 ? "Overdue Dues" : "On Track"}
          badgeStatus={metrics.total_overdue_receivables > 0 ? "HIGH" : "LOW"}
          accentColor={metrics.total_overdue_receivables > 0 ? "amber" : "default"}
          onClick={() => navigate('/customers')}
        />

        <MetricCard
          title="Total Payables"
          value={formatINR(metrics.total_payables)}
          subtitle={
            metrics.total_overdue_payables > 0
              ? `${formatINR(metrics.total_overdue_payables)} past due`
              : "Contractual vendor obligations"
          }
          icon={ArrowUpRight}
          badge={metrics.total_overdue_payables > 0 ? "Overdue Bills" : "Contractual"}
          badgeStatus={metrics.total_overdue_payables > 0 ? "HIGH" : "LOW"}
          accentColor={metrics.total_overdue_payables > 0 ? "crimson" : "default"}
          onClick={() => navigate('/suppliers')}
        />

        <MetricCard
          title="30-Day Lowest Balance"
          value={formatINR(metrics.projected_lowest_balance)}
          subtitle={
            metrics.lowest_balance_date
              ? `Dip expected on ${formatDate(metrics.lowest_balance_date)}`
              : "Stable liquidity across 30 days"
          }
          icon={TrendingUp}
          badge={metrics.liquidity_risk_status}
          badgeStatus={metrics.liquidity_risk_status}
          accentColor={metrics.liquidity_risk_status === 'CRITICAL' ? 'crimson' : (metrics.liquidity_risk_status === 'WARNING' ? 'amber' : 'sage')}
          onClick={() => navigate('/forecast')}
        />
      </div>

      {/* 30-Day Liquidity Forecast Chart Section */}
      <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-ivory">30-Day Forward Daily Cash Trajectory</h3>
            <p className="text-xs text-gray-soft mt-0.5">
              Daily closing balance curve incorporating customer payment delays against contractual obligations
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-soft">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sage inline-block" />
              <span>Closing Balance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 border-t border-dashed border-amber inline-block" />
              <span>Operating Reserve ({formatINR(data.business.minimum_reserve)})</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cashflow_chart_data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252F29" vertical={false} />
              <XAxis dataKey="date" stroke="#717C71" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#717C71"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => formatINRCompact(val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={Number(data.business.minimum_reserve)}
                stroke="#D9AD68"
                strokeDasharray="4 4"
                label={{ value: 'Reserve Limit', fill: '#D9AD68', fontSize: 10, position: 'insideTopRight' }}
              />
              <ReferenceLine y={0} stroke="#D66B70" strokeWidth={1.5} />
              <Bar dataKey="inflows" fill="#8DB69A" opacity={0.3} barSize={8} name="Inflow" />
              <Bar dataKey="outflows" fill="#D66B70" opacity={0.3} barSize={8} name="Outflow" />
              <Line
                type="monotone"
                dataKey="closing_balance"
                stroke="#A3B89A"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#A3B89A' }}
                activeDot={{ r: 6, fill: '#C6A96B' }}
                name="Closing Cash"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accounting Profit vs Available Cash Analysis Card */}
      <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-olive text-champagne">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ivory">Accounting Profit vs Available Cash</h3>
            <p className="text-xs text-gray-soft">
              Understanding why accrual accounting profit differs from real spendable liquidity
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 border-y border-olive-muted my-4 tabular-nums">
          <div className="p-4 rounded-xl bg-olive/40 border border-olive-muted">
            <p className="text-xs text-gray-soft mb-1">Billed Revenue (Accrual)</p>
            <p className="text-lg font-bold text-ivory">{formatINR(profit_vs_cash.accounting_revenue)}</p>
            <p className="text-[10px] text-gray-soft mt-1">Invoices issued to customers</p>
          </div>

          <div className="p-4 rounded-xl bg-olive/40 border border-olive-muted">
            <p className="text-xs text-gray-soft mb-1">Recognized Expenses</p>
            <p className="text-lg font-bold text-ivory">{formatINR(profit_vs_cash.total_accounting_expenses)}</p>
            <p className="text-[10px] text-gray-soft mt-1">Supplier bills + direct overheads</p>
          </div>

          <div className="p-4 rounded-xl bg-olive/40 border border-olive-muted">
            <p className="text-xs text-gray-soft mb-1">Accounting Net Profit</p>
            <p className="text-lg font-bold text-sage">{formatINR(profit_vs_cash.accounting_net_profit)}</p>
            <p className="text-[10px] text-gray-soft mt-1">Profit on paper</p>
          </div>

          <div className="p-4 rounded-xl bg-olive border border-champagne/40">
            <p className="text-xs text-champagne mb-1 font-semibold">Real Available Cash</p>
            <p className="text-lg font-bold text-ivory">{formatINR(profit_vs_cash.available_cash)}</p>
            <p className="text-[10px] text-champagne/80 mt-1">Actual bank balance</p>
          </div>
        </div>

        <div className="bg-olive/60 rounded-xl p-4 text-xs space-y-2">
          <p className="font-semibold text-ivory">{profit_vs_cash.conclusion}</p>
          {profit_vs_cash.explanations && profit_vs_cash.explanations.map((exp, idx) => (
            <p key={idx} className="text-gray-soft flex items-start gap-2">
              <span className="text-sage mt-0.5">•</span>
              <span>{exp}</span>
            </p>
          ))}
        </div>
      </div>

      {/* Two Column Section: Customers at Risk & Upcoming Supplier Obligations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Risk Overview */}
        <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-ivory">Customer Payment Reliability</h3>
                <p className="text-xs text-gray-soft">Track debtors with delay tendencies</p>
              </div>
              <Link to="/customers" className="text-xs font-semibold text-sage hover:underline flex items-center gap-1">
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex items-center gap-3 mb-4 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-crimson/15 text-crimson font-medium">
                {customer_risk_summary.high_risk_count} High Risk
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber/15 text-amber font-medium">
                {customer_risk_summary.moderate_risk_count} Moderate Risk
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-sage/15 text-sage font-medium">
                {customer_risk_summary.low_risk_count} Low Risk
              </span>
            </div>

            <div className="space-y-2.5">
              {customer_risk_summary.high_risk_customers.length === 0 ? (
                <p className="text-xs text-gray-soft py-4 text-center">No high risk customers detected.</p>
              ) : (
                customer_risk_summary.high_risk_customers.map((c) => (
                  <div
                    key={c.customer_id}
                    onClick={() => navigate(`/customers/${c.customer_id}`)}
                    className="p-3 rounded-xl bg-olive border border-olive-muted hover:border-crimson/40 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-ivory">{c.customer_name}</p>
                      <p className="text-[11px] text-gray-soft">
                        Avg delay: <span className="text-crimson font-medium">{c.average_delay_days} days late</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-ivory tabular-nums">{formatINR(c.total_outstanding)}</p>
                      <StatusBadge status="HIGH" label={`Score: ${c.reliability_score || 'N/A'}`} size="xs" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Supplier Obligations */}
        <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-ivory">Upcoming Supplier Obligations</h3>
                <p className="text-xs text-gray-soft">Contractual vendor payments due soon</p>
              </div>
              <Link to="/suppliers" className="text-xs font-semibold text-sage hover:underline flex items-center gap-1">
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs tabular-nums">
              <div className="p-2.5 rounded-xl bg-olive border border-olive-muted">
                <p className="text-[10px] text-gray-soft">Next 7 Days</p>
                <p className="font-bold text-ivory mt-0.5">{formatINR(payables_summary.due_next_7_days)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-olive border border-olive-muted">
                <p className="text-[10px] text-gray-soft">Next 15 Days</p>
                <p className="font-bold text-ivory mt-0.5">{formatINR(payables_summary.due_next_15_days)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-olive border border-olive-muted">
                <p className="text-[10px] text-gray-soft">Next 30 Days</p>
                <p className="font-bold text-ivory mt-0.5">{formatINR(payables_summary.due_next_30_days)}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {payables_summary.upcoming_bills.length === 0 ? (
                <p className="text-xs text-gray-soft py-4 text-center">No upcoming bills within 30 days.</p>
              ) : (
                payables_summary.upcoming_bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-3 rounded-xl bg-olive border border-olive-muted flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-ivory">{bill.supplier_name}</p>
                      <p className="text-[11px] text-gray-soft">
                        Due: {formatDate(bill.due_date)} {bill.is_overdue && <span className="text-crimson font-medium">({bill.days_overdue}d overdue)</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-ivory tabular-nums">{formatINR(bill.outstanding_amount)}</p>
                      <StatusBadge status={bill.is_overdue ? "OVERDUE" : "CONFIRMED"} size="xs" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table Preview */}
      <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-ivory">Recent Transactions Ledger</h3>
            <p className="text-xs text-gray-soft">Audited cash movements and bank reconciliations</p>
          </div>
          <Link to="/transactions" className="text-xs font-semibold text-sage hover:underline flex items-center gap-1">
            <span>View All Transactions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-olive-muted text-gray-soft font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Category / Type</th>
                <th className="py-3 px-3">Payment Mode</th>
                <th className="py-3 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-olive-muted/60">
              {recent_transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-olive/40 transition-colors">
                  <td className="py-3 px-3 font-mono text-gray-soft">{tx.date}</td>
                  <td className="py-3 px-3 font-medium text-ivory max-w-xs truncate">{tx.description}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-olive text-gray-soft border border-olive-muted text-[10px]">
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-soft">{tx.payment_mode || 'Bank Transfer'}</td>
                  <td className={`py-3 px-3 text-right font-bold tabular-nums ${tx.direction === 'INFLOW' ? 'text-sage' : 'text-crimson'}`}>
                    {tx.direction === 'INFLOW' ? '+' : '-'}{formatINR(tx.amount)}
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
