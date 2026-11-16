import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Calendar,
  Layers,
  Info,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  RefreshCw,
  X,
  ChevronRight
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
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { formatINR, formatINRCompact } from '../utils/currency';
import { formatDate } from '../utils/dates';

export function ForecastPage() {
  const { activeBusiness } = useBusiness();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await api.get('/forecast');
      setData(res.data);
    } catch (err) {
      console.error("Failed to load forecast", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusiness) {
      fetchForecast();
    }
  }, [activeBusiness]);

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-gray-soft">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sage mb-2" />
        Simulating 30-day forward liquidity trajectories...
      </div>
    );
  }

  if (!data || !data.has_business || !data.forecast) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No forecast data available"
        description="Establish your enterprise opening balance or import transaction records to compute the 30-day forward liquidity trajectory."
      />
    );
  }

  const { forecast, risk_evaluation } = data;
  const { daily_forecast, uncertain_collections, forecast_assumptions } = forecast;

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
              <span>Confirmed Inflows:</span>
              <span>{formatINR(pData.inflows)}</span>
            </p>
            <p className="text-[#C77F83] flex justify-between gap-4">
              <span>Committed Outflows:</span>
              <span>{formatINR(pData.outflows)}</span>
            </p>
            <p className="text-[#C9A875] flex justify-between gap-4 pt-1 border-t border-[#383D43]/60">
              <span>Reserve Threshold:</span>
              <span>{formatINR(forecast.minimum_operating_reserve)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ivory">
            30-Day Liquidity Forecast
          </h1>
          <p className="text-xs text-gray-soft mt-1">
            Deterministic daily cash position modeling buyer payment delays against contractual obligations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge
            status={risk_evaluation.risk_status}
            label={risk_evaluation.severity_label}
          />
        </div>
      </div>

      {/* Risk Alert Banner if Reserve Breached */}
      {risk_evaluation.risk_status !== 'HEALTHY' && (
        <AlertBanner
          type={risk_evaluation.risk_status}
          title={risk_evaluation.severity_label}
          message={risk_evaluation.risk_explanation}
        />
      )}

      {/* 4 Key Forecast Metrics (2 cols on intermediate desktop, 4 cols on large desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 tabular-nums w-full min-w-0">
        <div className="min-w-0 h-full">
          <MetricCard
            title="Starting Cash Position"
            value={formatINR(forecast.initial_cash_balance)}
            subtitle="Physical reconciled opening balance"
            icon={Calendar}
            accentColor="sage"
          />
        </div>

        <div className="min-w-0 h-full">
          <MetricCard
            title="Scheduled 30-Day Inflows"
            value={formatINR(forecast.total_projected_inflows)}
            subtitle="Delay-adjusted buyer settlements"
            icon={ArrowDownLeft}
            accentColor="default"
          />
        </div>

        <div className="min-w-0 h-full">
          <MetricCard
            title="Contractual Outflows"
            value={formatINR(forecast.total_projected_outflows)}
            subtitle="Vendor bills, payroll & overheads"
            icon={ArrowUpRight}
            accentColor="default"
          />
        </div>

        <div className="min-w-0 h-full">
          <MetricCard
            title="Projected Lowest Balance"
            value={formatINR(forecast.lowest_projected_balance)}
            subtitle={
              forecast.lowest_balance_date
                ? `Estimated dip on ${formatDate(forecast.lowest_balance_date)}`
                : "Stable liquidity across horizon"
            }
            icon={TrendingUp}
            accentColor={forecast.lowest_projected_balance < 0 ? 'crimson' : (forecast.lowest_projected_balance < forecast.minimum_operating_reserve ? 'amber' : 'emerald')}
          />
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="bg-[#202327] border border-[#383D43] rounded-xl p-5 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[#F1F2F3]">Daily Closing Cash Curve (Day 1 to 30)</h3>
            <p className="text-xs text-[#A0A5AC] mt-0.5">
              Click any point in the table below to inspect underlying line receipts and vouchers
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#A0A5AC]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8299AD] inline-block" />
              <span>Closing Balance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 border-t border-dashed border-[#C9A875] inline-block" />
              <span>Operating Reserve ({formatINR(forecast.minimum_operating_reserve)})</span>
            </div>
          </div>
        </div>

        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={daily_forecast} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#292D32" vertical={false} />
              <XAxis dataKey="date_str" stroke="#A0A5AC" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#A0A5AC"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => formatINRCompact(val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={Number(forecast.minimum_operating_reserve)}
                stroke="#C9A875"
                strokeDasharray="4 4"
                label={{ value: 'Reserve Buffer', fill: '#C9A875', fontSize: 10, position: 'insideTopRight' }}
              />
              <ReferenceLine y={0} stroke="#C77F83" strokeWidth={1.5} />
              <Bar dataKey="inflows" fill="#8DA995" opacity={0.3} barSize={8} name="Inflows" />
              <Bar dataKey="outflows" fill="#C77F83" opacity={0.3} barSize={8} name="Outflows" />
              <Line
                type="monotone"
                dataKey="closing_balance"
                stroke="#8299AD"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#8299AD' }}
                activeDot={{ r: 6, fill: '#B8BEC5' }}
                name="Closing Cash"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Uncertain Collections Disclosure */}
      {uncertain_collections && uncertain_collections.length > 0 && (
        <div className="bg-[#202327] border border-[#C9A875]/30 rounded-xl p-4 sm:p-5 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-4 h-4 text-[#C9A875] flex-shrink-0" />
            <h3 className="text-xs sm:text-sm font-semibold text-[#F1F2F3]">
              Excluded Uncertain Customer Receivables ({uncertain_collections.length})
            </h3>
          </div>
          <p className="text-xs text-[#A0A5AC] mb-3 leading-relaxed">
            In compliance with deterministic financial integrity rules, the following customer dues are <span className="text-[#C9A875] font-semibold">excluded from spendable cash</span> due to chronic delay history or severe aging (&gt;45 days). They are never treated as guaranteed cash.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {uncertain_collections.map((u, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#292D32] border border-[#383D43] text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-[#F1F2F3]">{u.customer_name}</span>
                  <span className="font-bold text-[#C9A875] tabular-nums">{formatINR(u.amount)}</span>
                </div>
                <p className="text-[11px] text-[#A0A5AC]">{u.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 30-Day Daily Breakdown Table */}
      <div className="bg-[#202327] border border-[#383D43] rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-[#383D43] bg-[#292D32] flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-semibold text-[#F1F2F3]">Daily Cashflow Ledger (Day 1 to 30)</h3>
          <span className="text-[10px] text-[#A0A5AC]">Click any row to inspect itemized line items</span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-olive/60 sticky top-0 text-[10px] uppercase text-gray-soft border-b border-olive-muted">
              <tr>
                <th className="py-2.5 px-3">Day</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Opening Balance</th>
                <th className="py-2.5 px-3 text-right">Inflows</th>
                <th className="py-2.5 px-3 text-right">Outflows</th>
                <th className="py-2.5 px-3 text-right">Closing Balance</th>
                <th className="py-2.5 px-3 text-center">Liquidity Status</th>
                <th className="py-2.5 px-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-olive-muted/60">
              {daily_forecast.map((d) => (
                <tr
                  key={d.day_number}
                  onClick={() => setSelectedDay(d)}
                  className="hover:bg-olive/40 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-mono text-gray-soft">Day {d.day_number}</td>
                  <td className="py-2.5 px-3 font-mono font-medium text-ivory">{d.date_str}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-gray-soft">{formatINR(d.opening_balance)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-emerald">
                    {d.inflows > 0 ? `+${formatINR(d.inflows)}` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-crimson">
                    {d.outflows > 0 ? `-${formatINR(d.outflows)}` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold text-ivory">
                    {formatINR(d.closing_balance)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <StatusBadge
                      status={d.closing_balance < 0 ? "CRITICAL" : (d.closing_balance < forecast.minimum_operating_reserve ? "WARNING" : "HEALTHY")}
                      size="xs"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center text-sage">
                    <ChevronRight className="w-3.5 h-3.5 mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Itemized Line Modal */}
      {selectedDay && (
        <Modal
          isOpen={!!selectedDay}
          onClose={() => setSelectedDay(null)}
          title={`Day ${selectedDay.day_number} Schedule • ${selectedDay.date_str}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-olive/50 border border-olive-muted tabular-nums">
              <div>
                <span className="text-gray-soft text-[10px] uppercase">Opening Balance</span>
                <p className="text-sm font-bold text-ivory mt-0.5">{formatINR(selectedDay.opening_balance)}</p>
              </div>
              <div className="text-right">
                <span className="text-gray-soft text-[10px] uppercase">Closing Balance</span>
                <p className="text-sm font-bold text-sage mt-0.5">{formatINR(selectedDay.closing_balance)}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-ivory mb-2">Itemized Inflows & Outflows:</h4>
              {selectedDay.items && selectedDay.items.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedDay.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-olive/40 border border-olive-muted flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-ivory">{item.description}</p>
                        <p className="text-[10px] text-gray-soft">{item.party_name || 'General Operation'} • {item.type}</p>
                      </div>
                      <span className={`font-bold tabular-nums ${item.direction === 'INFLOW' ? 'text-emerald' : 'text-crimson'}`}>
                        {item.direction === 'INFLOW' ? '+' : '-'}{formatINR(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-soft py-4 text-center">No cash transactions scheduled on this day.</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
