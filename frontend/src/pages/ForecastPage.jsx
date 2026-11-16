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
      <div className="py-20 text-center text-xs text-gray-soft">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sage mb-2" />
        Calculating 30-day daily cashflow projection...
      </div>
    );
  }

  if (!data || !data.has_business || !data.forecast) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No forecast data available"
        description="Establish your business opening balance or import transaction records to compute the 30-day liquidity trajectory."
      />
    );
  }

  const { forecast, risk_evaluation } = data;
  const { daily_forecast, uncertain_collections, forecast_assumptions } = forecast;

  // Custom Chart Tooltip
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
              <span>{formatINR(forecast.minimum_operating_reserve)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ivory">30-Day Liquidity Forecast</h1>
          <p className="text-xs text-gray-soft mt-1">
            Deterministic daily cash position modeling customer payment delays against contractual obligations
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

      {/* 4 Key Forecast Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        <MetricCard
          title="Starting Cash Position"
          value={formatINR(forecast.initial_cash_balance)}
          subtitle="Reconciled cash at Day 1"
          icon={Calendar}
          accentColor="sage"
        />

        <MetricCard
          title="Expected 30-Day Inflows"
          value={formatINR(forecast.total_projected_inflows)}
          subtitle="Collections & scheduled credits"
          icon={ArrowDownLeft}
          accentColor="default"
        />

        <MetricCard
          title="Contractual Outflows"
          value={formatINR(forecast.total_projected_outflows)}
          subtitle="Vendor bills, payroll & overheads"
          icon={ArrowUpRight}
          accentColor="default"
        />

        <MetricCard
          title="Projected Lowest Balance"
          value={formatINR(forecast.lowest_projected_balance)}
          subtitle={
            forecast.lowest_balance_date
              ? `Estimated on ${formatDate(forecast.lowest_balance_date)}`
              : "Stable"
          }
          icon={TrendingUp}
          accentColor={forecast.lowest_projected_balance < 0 ? 'crimson' : (forecast.lowest_projected_balance < forecast.minimum_operating_reserve ? 'amber' : 'sage')}
        />
      </div>

      {/* Forecast Chart */}
      <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-ivory">Projected Daily Closing Cash Curve</h3>
            <p className="text-xs text-gray-soft mt-0.5">
              Click on any bar or point in the table below to inspect specific line items contributing to that day
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-soft">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sage inline-block" />
              <span>Closing Balance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 border-t border-dashed border-amber inline-block" />
              <span>Reserve Threshold</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={daily_forecast} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252F29" vertical={false} />
              <XAxis dataKey="date_str" stroke="#717C71" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#717C71"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => formatINRCompact(val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={Number(forecast.minimum_operating_reserve)}
                stroke="#D9AD68"
                strokeDasharray="4 4"
                label={{ value: 'Reserve Limit', fill: '#D9AD68', fontSize: 10, position: 'insideTopRight' }}
              />
              <ReferenceLine y={0} stroke="#D66B70" strokeWidth={1.5} />
              <Bar dataKey="inflows" fill="#8DB69A" opacity={0.3} barSize={8} name="Inflows" />
              <Bar dataKey="outflows" fill="#D66B70" opacity={0.3} barSize={8} name="Outflows" />
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

      {/* Uncertain Collections & Limitations Banner */}
      {uncertain_collections && uncertain_collections.length > 0 && (
        <div className="bg-moss border border-amber/30 rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber flex-shrink-0" />
            <h3 className="text-sm font-semibold text-ivory">
              Excluded Uncertain Customer Collections ({uncertain_collections.length})
            </h3>
          </div>
          <p className="text-xs text-gray-soft mb-3">
            In compliance with deterministic financial integrity rules, the following customer receivables have been <span className="text-amber font-semibold">excluded from guaranteed cash balances</span> due to chronic late payment behaviour or severe overdue aging (&gt;45 days):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {uncertain_collections.map((u, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-olive border border-olive-muted text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-ivory">{u.customer_name}</span>
                  <span className="font-bold text-amber tabular-nums">{formatINR(u.amount)}</span>
                </div>
                <p className="text-[11px] text-gray-soft">{u.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 30-Day Daily Breakdown Table */}
      <div className="bg-moss border border-olive-muted rounded-2xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-olive-muted bg-olive/30 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ivory">Daily Cashflow Ledger (Day 1 to Day 30)</h3>
          <span className="text-[11px] text-gray-soft">Click any day for itemized line receipts and vouchers</span>
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
                  <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-sage">
                    {d.inflows > 0 ? `+${formatINR(d.inflows)}` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-crimson">
                    {d.outflows > 0 ? `-${formatINR(d.outflows)}` : '-'}
                  </td>
                  <td className={`py-2.5 px-3 text-right tabular-nums font-bold ${
                    d.closing_balance < 0 ? 'text-crimson' : (d.is_below_reserve ? 'text-amber' : 'text-ivory')
                  }`}>
                    {formatINR(d.closing_balance)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {d.closing_balance < 0 ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-crimson/15 text-crimson font-medium">Deficit</span>
                    ) : d.is_below_reserve ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber/15 text-amber font-medium">Below Reserve</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sage/15 text-sage font-medium">Healthy</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-sage text-xs hover:underline flex items-center justify-center gap-0.5">
                      <span>Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assumptions & Method Documentation */}
      <div className="bg-olive/30 border border-olive-muted rounded-2xl p-5 text-xs text-gray-soft space-y-2">
        <h4 className="font-semibold text-ivory flex items-center gap-2">
          <Info className="w-4 h-4 text-sage" />
          <span>Forecast Assumptions & Calculation Methodology</span>
        </h4>
        <ul className="list-disc list-inside space-y-1">
          {forecast_assumptions.map((assump, idx) => (
            <li key={idx}>{assump}</li>
          ))}
        </ul>
      </div>

      {/* Day Drilldown Modal */}
      <Modal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? `Financial Ledger Drilldown: Day ${selectedDay.day_number} (${selectedDay.date_str})` : 'Day Drilldown'}
        maxWidth="max-w-3xl"
      >
        {selectedDay && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-olive border border-olive-muted text-xs tabular-nums text-center">
              <div>
                <span className="text-[10px] text-gray-soft uppercase">Day Opening</span>
                <p className="font-bold text-ivory mt-0.5">{formatINR(selectedDay.opening_balance)}</p>
              </div>
              <div>
                <span className="text-[10px] text-gray-soft uppercase">Net Daily Variance</span>
                <p className={`font-bold mt-0.5 ${selectedDay.net_change >= 0 ? 'text-sage' : 'text-crimson'}`}>
                  {selectedDay.net_change >= 0 ? '+' : ''}{formatINR(selectedDay.net_change)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-gray-soft uppercase">Day Closing</span>
                <p className={`font-bold mt-0.5 ${selectedDay.closing_balance < 0 ? 'text-crimson' : (selectedDay.is_below_reserve ? 'text-amber' : 'text-ivory')}`}>
                  {formatINR(selectedDay.closing_balance)}
                </p>
              </div>
            </div>

            {/* Inflows list */}
            <div>
              <h4 className="text-xs font-semibold text-sage uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4" />
                <span>Scheduled Inflows ({selectedDay.inflow_items.length})</span>
              </h4>
              {selectedDay.inflow_items.length === 0 ? (
                <p className="text-xs text-gray-soft p-3 rounded-xl bg-olive/30 border border-olive-muted">
                  No customer collections or cash receipts scheduled for this date.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDay.inflow_items.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-olive border border-olive-muted text-xs flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-ivory">{item.entity_name} ({item.invoice_number})</p>
                        <p className="text-[11px] text-gray-soft">{item.assumptions}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sage tabular-nums">{formatINR(item.amount)}</p>
                        <StatusBadge status={item.status} size="xs" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outflows list */}
            <div>
              <h4 className="text-xs font-semibold text-crimson uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4" />
                <span>Scheduled Outflows ({selectedDay.outflow_items.length})</span>
              </h4>
              {selectedDay.outflow_items.length === 0 ? (
                <p className="text-xs text-gray-soft p-3 rounded-xl bg-olive/30 border border-olive-muted">
                  No vendor payments or operating expenses due on this date.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDay.outflow_items.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-olive border border-olive-muted text-xs flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-ivory">{item.entity_name} ({item.invoice_number})</p>
                        <p className="text-[11px] text-gray-soft">{item.assumptions}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-crimson tabular-nums">{formatINR(item.amount)}</p>
                        <StatusBadge status={item.status} size="xs" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
