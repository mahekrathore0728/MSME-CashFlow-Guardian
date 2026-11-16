import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Scale,
  ChevronRight,
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
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#8299AD]">
        <div className="w-7 h-7 border-2 border-[#8299AD] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[#A0A5AC] font-mono">Auditing real-time financial engine records...</span>
      </div>
    );
  }

  if (!data || !data.has_business) {
    return (
      <EmptyState
        title="No Business Configured"
        description="Establish your enterprise opening parameters or load the Sharma & Co. sample dataset to inspect live financial intelligence."
        actionText="Load Sample Data"
        onAction={loadDemoData}
        secondaryActionText="Configure New Business"
        onSecondaryAction={() => navigate('/setup')}
      />
    );
  }

  const { metrics, profit_vs_cash, cashflow_chart_data, customer_risk_summary, payables_summary, recent_transactions, alerts } = data;

  // Graphite Noir Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      return (
        <div className="bg-[#202327] border border-[#383D43] rounded-xl p-3.5 shadow-modal text-xs">
          <p className="font-semibold text-[#F1F2F3] mb-2 pb-1.5 border-b border-[#383D43]">{label}</p>
          <div className="space-y-1.5 tabular-nums">
            <p className="text-[#8299AD] flex justify-between gap-4 font-medium">
              <span>Closing Balance:</span>
              <span className="font-bold">{formatINR(pData.closing_balance)}</span>
            </p>
            <p className="text-[#8DA995] flex justify-between gap-4">
              <span>Scheduled Inflows:</span>
              <span>{formatINR(pData.inflows)}</span>
            </p>
            <p className="text-[#C77F83] flex justify-between gap-4">
              <span>Committed Outflows:</span>
              <span>{formatINR(pData.outflows)}</span>
            </p>
            <p className="text-[#C9A875] flex justify-between gap-4 pt-1 border-t border-[#383D43]/60">
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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 w-full min-w-0 bg-[#111214]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F1F2F3]">
              Executive Overview
            </h1>
            {data.business.is_demo && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#292D32] text-[#B8BEC5] border border-[#383D43] uppercase tracking-wider">
                SAMPLE DATA
              </span>
            )}
          </div>
          <p className="text-xs text-[#A0A5AC] mt-1">
            Reconciled cash liquidity, customer payment reliability, and forward reserve trajectory
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Link
            to="/transactions"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#8299AD] text-[#111214] font-bold text-xs tracking-wide hover:bg-[#94ABBF] transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Transaction</span>
          </Link>
          <Link
            to="/forecast"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#292D32] border border-[#383D43] text-[#F1F2F3] font-semibold text-xs hover:border-[#8299AD] transition-colors"
          >
            <span>30-Day Forecast</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Overdue Receivables Notice */}
      {metrics.total_overdue_receivables > 0 && (
        <AlertBanner
          type="WARNING"
          title="Outstanding Overdue Dues"
          message={`${formatINR(metrics.total_overdue_receivables)} in customer receivables have passed their contractual credit terms.`}
          actionText="Inspect Debtors"
          onAction={() => navigate('/customers')}
        />
      )}

      {/* Critical Liquidity Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2.5 w-full min-w-0">
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

      {/* Primary 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full min-w-0">
        <div className="min-w-0 h-full">
          <MetricCard
            title="Current Cash Balance"
            value={formatINR(metrics.current_cash_balance)}
            subtitle="Physical reconciled bank balance"
            icon={Wallet}
            accentColor="sage"
            onClick={() => navigate('/transactions')}
          />
        </div>

        <div className="min-w-0 h-full">
          <MetricCard
            title="Total Receivables"
            value={formatINR(metrics.total_receivables)}
            subtitle={
              metrics.total_overdue_receivables > 0
                ? `${formatINR(metrics.total_overdue_receivables)} past contractual due date`
                : "All customer accounts are current"
            }
            icon={ArrowDownLeft}
            badge={metrics.total_overdue_receivables > 0 ? "Past Due" : "On Track"}
            badgeStatus={metrics.total_overdue_receivables > 0 ? "HIGH" : "LOW"}
            accentColor={metrics.total_overdue_receivables > 0 ? "amber" : "default"}
            onClick={() => navigate('/customers')}
          />
        </div>

        <div className="min-w-0 h-full">
          <MetricCard
            title="Total Payables"
            value={formatINR(metrics.total_payables)}
            subtitle={
              metrics.total_overdue_payables > 0
                ? `${formatINR(metrics.total_overdue_payables)} overdue supplier dues`
                : "Contractual trade supplier commitments"
            }
            icon={ArrowUpRight}
            badge={metrics.total_overdue_payables > 0 ? "Overdue Bills" : "Scheduled"}
            badgeStatus={metrics.total_overdue_payables > 0 ? "HIGH" : "LOW"}
            accentColor={metrics.total_overdue_payables > 0 ? "crimson" : "default"}
            onClick={() => navigate('/suppliers')}
          />
        </div>

        <div className="min-w-0 h-full">
          <MetricCard
            title="30-Day Lowest Balance"
            value={formatINR(metrics.projected_lowest_balance)}
            subtitle={
              metrics.lowest_balance_date
                ? `Dip projected on ${formatDate(metrics.lowest_balance_date)}`
                : "Stable liquidity cushion across 30 days"
            }
            icon={TrendingUp}
            badge={metrics.liquidity_risk_status}
            badgeStatus={metrics.liquidity_risk_status}
            accentColor={metrics.liquidity_risk_status === 'CRITICAL' ? 'crimson' : (metrics.liquidity_risk_status === 'WARNING' ? 'amber' : 'emerald')}
            onClick={() => navigate('/forecast')}
          />
        </div>
      </div>

      {/* 30-Day Liquidity Forecast Chart Section */}
      <div className="bg-[#202327] border border-[#383D43] rounded-xl p-5 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[#F1F2F3]">30-Day Cash Trajectory</h3>
            <p className="text-xs text-[#A0A5AC] mt-0.5">
              Daily closing cash trajectory integrating empirical customer payment delays against vendor obligations
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#A0A5AC]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8299AD] inline-block" />
              <span>Closing Balance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 border-t border-dashed border-[#C9A875] inline-block" />
              <span>Reserve Threshold ({formatINR(data.business.minimum_reserve)})</span>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cashflow_chart_data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#292D32" vertical={false} />
              <XAxis dataKey="date" stroke="#A0A5AC" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#A0A5AC"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => formatINRCompact(val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={parseFloat(data.business.minimum_reserve)}
                stroke="#C9A875"
                strokeDasharray="4 4"
                label={{ value: 'Reserve Buffer', fill: '#C9A875', fontSize: 10, position: 'insideBottomRight' }}
              />
              <Bar dataKey="inflows" fill="#8DA995" opacity={0.3} barSize={8} name="Inflows" />
              <Bar dataKey="outflows" fill="#C77F83" opacity={0.3} barSize={8} name="Outflows" />
              <Line
                type="monotone"
                dataKey="closing_balance"
                stroke="#8299AD"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#8299AD' }}
                activeDot={{ r: 5, fill: '#8299AD', stroke: '#111214', strokeWidth: 2 }}
                name="Closing Balance"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accounting Profit vs Available Cash Analysis */}
      <div className="bg-[#202327] border border-[#383D43] rounded-xl p-5 sm:p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[#292D32] text-[#B8BEC5] border border-[#383D43]">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[#F1F2F3]">Accounting Profit vs Available Cash</h3>
            <p className="text-xs text-[#A0A5AC]">
              Comparing accrual profit on paper against physical liquidity in bank accounts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 py-3 border-y border-[#383D43] my-4 tabular-nums w-full min-w-0">
          <div className="p-3.5 rounded-lg bg-[#292D32] border border-[#383D43] min-w-0">
            <p className="text-xs text-[#A0A5AC] mb-1">Billed Revenue (Accrual)</p>
            <p className="text-base sm:text-lg font-bold text-[#F1F2F3] truncate">{formatINR(profit_vs_cash.accounting_revenue)}</p>
            <p className="text-[10px] text-[#A0A5AC] mt-1 truncate">Invoices issued to buyers</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#292D32] border border-[#383D43] min-w-0">
            <p className="text-xs text-[#A0A5AC] mb-1">Recognized Expenses</p>
            <p className="text-base sm:text-lg font-bold text-[#F1F2F3] truncate">{formatINR(profit_vs_cash.total_accounting_expenses)}</p>
            <p className="text-[10px] text-[#A0A5AC] mt-1 truncate">Vendor bills & direct overhead</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#292D32] border border-[#383D43] min-w-0">
            <p className="text-xs text-[#A0A5AC] mb-1">Accounting Net Profit</p>
            <p className="text-base sm:text-lg font-bold text-[#8299AD] truncate">{formatINR(profit_vs_cash.accounting_net_profit)}</p>
            <p className="text-[10px] text-[#A0A5AC] mt-1 truncate">Net profit on paper</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#292D32] border border-[#B8BEC5]/40 min-w-0">
            <p className="text-xs text-[#B8BEC5] mb-1 font-semibold">Real Available Cash</p>
            <p className="text-base sm:text-lg font-bold text-[#F1F2F3] truncate">{formatINR(profit_vs_cash.available_cash)}</p>
            <p className="text-[10px] text-[#B8BEC5]/80 mt-1 truncate">Spendable bank liquidity</p>
          </div>
        </div>

        <div className="bg-[#292D32] border border-[#383D43] rounded-lg p-4 text-xs space-y-2">
          <p className="font-semibold text-[#F1F2F3]">{profit_vs_cash.conclusion}</p>
          {profit_vs_cash.explanations && profit_vs_cash.explanations.map((exp, idx) => (
            <p key={idx} className="text-[#A0A5AC] flex items-start gap-2">
              <span className="text-[#8299AD] mt-0.5">•</span>
              <span>{exp}</span>
            </p>
          ))}
        </div>
      </div>

      {/* Two Column Section: Customers at Risk & Upcoming Supplier Obligations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Risk Overview */}
        <div className="bg-[#202327] border border-[#383D43] rounded-xl p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-[#F1F2F3]">Customer Payment Reliability</h3>
                <p className="text-xs text-[#A0A5AC]">Track debtors with delay tendencies</p>
              </div>
              <Link to="/customers" className="text-xs font-semibold text-[#8299AD] hover:underline flex items-center gap-1">
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex items-center gap-2 mb-4 text-xs flex-wrap">
              <span className="px-2 py-0.5 rounded bg-[#292D32] text-[#C77F83] font-medium border border-[#C77F83]/40">
                {customer_risk_summary.high_risk_count} High Risk
              </span>
              <span className="px-2 py-0.5 rounded bg-[#292D32] text-[#C9A875] font-medium border border-[#C9A875]/40">
                {customer_risk_summary.moderate_risk_count} Moderate Risk
              </span>
              <span className="px-2 py-0.5 rounded bg-[#292D32] text-[#8DA995] font-medium border border-[#8DA995]/40">
                {customer_risk_summary.low_risk_count} Low Risk
              </span>
            </div>

            <div className="space-y-2.5">
              {customer_risk_summary.high_risk_customers.length === 0 ? (
                <p className="text-xs text-[#A0A5AC] py-4 text-center">No high risk accounts detected.</p>
              ) : (
                customer_risk_summary.high_risk_customers.map((c) => (
                  <div
                    key={c.customer_id}
                    onClick={() => navigate(`/customers/${c.customer_id}`)}
                    className="p-3 rounded-lg bg-[#292D32] border border-[#383D43] hover:border-[#C77F83] transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#F1F2F3]">{c.customer_name}</p>
                      <p className="text-[11px] text-[#A0A5AC]">
                        Avg delay: <span className="text-[#C77F83] font-medium">+{c.average_delay_days} days late</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#F1F2F3] tabular-nums">{formatINR(c.total_outstanding)}</p>
                      <StatusBadge status="HIGH" label={`Score: ${c.reliability_score || 'N/A'}`} size="xs" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Supplier Obligations */}
        <div className="bg-[#202327] border border-[#383D43] rounded-xl p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-[#F1F2F3]">Upcoming Supplier Obligations</h3>
                <p className="text-xs text-[#A0A5AC]">Contractual vendor payments due soon</p>
              </div>
              <Link to="/suppliers" className="text-xs font-semibold text-[#8299AD] hover:underline flex items-center gap-1">
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs tabular-nums">
              <div className="p-2.5 rounded-lg bg-[#292D32] border border-[#383D43]">
                <p className="text-[10px] text-[#A0A5AC]">Next 7 Days</p>
                <p className="font-bold text-[#F1F2F3] mt-0.5">{formatINR(payables_summary.due_next_7_days)}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#292D32] border border-[#383D43]">
                <p className="text-[10px] text-[#A0A5AC]">Next 15 Days</p>
                <p className="font-bold text-[#F1F2F3] mt-0.5">{formatINR(payables_summary.due_next_15_days)}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#292D32] border border-[#383D43]">
                <p className="text-[10px] text-[#A0A5AC]">Next 30 Days</p>
                <p className="font-bold text-[#F1F2F3] mt-0.5">{formatINR(payables_summary.due_next_30_days)}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {payables_summary.upcoming_bills.length === 0 ? (
                <p className="text-xs text-[#A0A5AC] py-4 text-center">No upcoming bills within 30 days.</p>
              ) : (
                payables_summary.upcoming_bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-3 rounded-lg bg-[#292D32] border border-[#383D43] flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#F1F2F3]">{bill.supplier_name}</p>
                      <p className="text-[11px] text-[#A0A5AC]">
                        Due: {formatDate(bill.due_date)} {bill.is_overdue && <span className="text-[#C77F83] font-medium">({bill.days_overdue}d overdue)</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#F1F2F3] tabular-nums">{formatINR(bill.outstanding_amount)}</p>
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
      <div className="bg-[#202327] border border-[#383D43] rounded-xl p-5 sm:p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[#F1F2F3]">Recent Transactions Ledger</h3>
            <p className="text-xs text-[#A0A5AC]">Audited cash movements and bank reconciliations</p>
          </div>
          <Link to="/transactions" className="text-xs font-semibold text-[#8299AD] hover:underline flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto -mx-5 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-5 sm:px-0">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#383D43] text-[#A0A5AC] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Payment Mode</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#383D43]/60">
                {recent_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#292D32] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#A0A5AC] whitespace-nowrap">{tx.date}</td>
                    <td className="py-2.5 px-3 font-medium text-[#F1F2F3] max-w-xs truncate">{tx.description}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[#292D32] text-[#A0A5AC] border border-[#383D43] text-[10px]">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#A0A5AC] whitespace-nowrap">{tx.payment_mode || 'Bank Transfer'}</td>
                    <td className={`py-2.5 px-3 text-right font-bold tabular-nums whitespace-nowrap ${tx.direction === 'INFLOW' ? 'text-[#8DA995]' : 'text-[#C77F83]'}`}>
                      {tx.direction === 'INFLOW' ? '+' : '-'}{formatINR(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
