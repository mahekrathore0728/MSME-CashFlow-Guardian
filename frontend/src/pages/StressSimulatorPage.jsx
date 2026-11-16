import React, { useState, useEffect } from 'react';
import {
  Cpu,
  AlertTriangle,
  Play,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
  Info,
  CheckCircle2,
  RefreshCw,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
import { formatINR, formatINRCompact } from '../utils/currency';
import { formatDate } from '../utils/dates';

export function StressSimulatorPage() {
  const { activeBusiness } = useBusiness();
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Simulation Parameters
  const [selectedScenario, setSelectedScenario] = useState('CUSTOMER_DELAY_15');
  const [targetCustomerId, setTargetCustomerId] = useState('');
  const [targetSupplierId, setTargetSupplierId] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('50000');
  const [expenseDayOffset, setExpenseDayOffset] = useState('7');
  const [customDelayDays, setCustomDelayDays] = useState('20');
  const [customHikePct, setCustomHikePct] = useState('15');

  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeBusiness) {
      api.get('/customers').then(res => {
        setCustomers(res.data);
        if (res.data.length > 0) setTargetCustomerId(res.data[0].id);
      });
      api.get('/suppliers').then(res => {
        setSuppliers(res.data);
        if (res.data.length > 0) setTargetSupplierId(res.data[0].id);
      });
      runSimulation('CUSTOMER_DELAY_15');
    }
  }, [activeBusiness]);

  const runSimulation = async (scenarioType = selectedScenario) => {
    setLoading(true);
    setError('');
    try {
      let params = {};
      if (scenarioType === 'CUSTOMER_DELAY_15' || scenarioType === 'CUSTOMER_DELAY_30' || scenarioType === 'PARTIAL_PAYMENT_50') {
        params.customer_id = targetCustomerId ? parseInt(targetCustomerId) : null;
      } else if (scenarioType === 'SUPPLIER_HIKE_20') {
        params.supplier_id = targetSupplierId ? parseInt(targetSupplierId) : null;
      } else if (scenarioType === 'UNEXPECTED_EXPENSE') {
        params.amount = parseFloat(expenseAmount) || 50000;
        params.delay_days = parseInt(expenseDayOffset) || 7;
      } else if (scenarioType === 'MULTIPLE_CUSTOMER_DELAYS') {
        params.delay_days = parseInt(customDelayDays) || 20;
      } else if (scenarioType === 'CUSTOM_SHOCK') {
        params.customer_delay_days = parseInt(customDelayDays) || 0;
        params.supplier_increase_pct = parseFloat(customHikePct) || 0;
        params.unexpected_expense = parseFloat(expenseAmount) || 0;
        params.expense_day_offset = parseInt(expenseDayOffset) || 7;
        params.customer_id = targetCustomerId ? parseInt(targetCustomerId) : null;
      }

      const res = await api.post('/scenarios/simulate', {
        scenario_type: scenarioType,
        parameters: params
      });
      setSimulationResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Simulation failed. Please check parameters.");
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioChange = (type) => {
    setSelectedScenario(type);
    runSimulation(type);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      return (
        <div className="bg-[#202327] border border-[#383D43] rounded-xl p-3.5 shadow-modal text-xs">
          <p className="font-semibold text-[#F1F2F3] mb-2 pb-1.5 border-b border-[#383D43]">{label}</p>
          <div className="space-y-1.5 tabular-nums">
            <p className="text-[#8299AD] flex justify-between gap-4 font-medium">
              <span>Baseline Position:</span>
              <span className="font-bold">{formatINR(pData.baseline_balance)}</span>
            </p>
            <p className="text-[#C77F83] flex justify-between gap-4 font-medium">
              <span>Simulated Balance:</span>
              <span className="font-bold">{formatINR(pData.simulated_balance)}</span>
            </p>
            <p className="text-[#A0A5AC] flex justify-between gap-4 pt-1 border-t border-[#383D43]/60">
              <span>Net Variance:</span>
              <span className={pData.variance < 0 ? 'text-[#C77F83] font-medium' : 'text-[#8DA995]'}>
                {formatINR(pData.variance)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const scenarioPills = [
    { id: 'CUSTOMER_DELAY_15', label: '15d Customer Delay' },
    { id: 'CUSTOMER_DELAY_30', label: '30d Customer Delay' },
    { id: 'SUPPLIER_HIKE_20', label: '+20% Supplier Price Hike' },
    { id: 'UNEXPECTED_EXPENSE', label: 'Emergency Expense' },
    { id: 'PARTIAL_PAYMENT_50', label: '50% Buyer Haircut' },
    { id: 'MULTIPLE_CUSTOMER_DELAYS', label: 'Systemic Delay' },
    { id: 'CUSTOM_SHOCK', label: 'Composite Shock' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ivory">
          What-If Stress Simulator
        </h1>
        <p className="text-xs text-gray-soft mt-1">
          Apply empirical shocks to evaluate working capital resilience before making commitments. Actual records remain 100% unaltered.
        </p>
      </div>

      {/* Scenario Selection Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {scenarioPills.map((s) => (
          <button
            key={s.id}
            onClick={() => handleScenarioChange(s.id)}
            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
              selectedScenario === s.id
                ? 'bg-[#202327] border-[#8299AD] text-[#F1F2F3] font-semibold shadow-card'
                : 'bg-[#292D32] border-[#383D43] text-[#A0A5AC] hover:text-[#F1F2F3] hover:bg-[#383D43]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Parameter Controls for Active Scenario */}
      <div className="bg-[#202327] border border-[#383D43] rounded-xl p-4 sm:p-5 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-sage" />
          <h3 className="text-xs font-semibold text-gray-soft uppercase tracking-wider">
            Configure Shock Parameters
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(selectedScenario === 'CUSTOMER_DELAY_15' || selectedScenario === 'CUSTOMER_DELAY_30' || selectedScenario === 'PARTIAL_PAYMENT_50' || selectedScenario === 'CUSTOM_SHOCK') && (
            <div>
              <label className="block text-[11px] font-medium text-gray-soft mb-1 uppercase">Target Customer</label>
              <select
                value={targetCustomerId}
                onChange={(e) => setTargetCustomerId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory focus:outline-none focus:border-sage"
              >
                <option value="">All Key Customers</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({formatINR(c.total_outstanding)})</option>
                ))}
              </select>
            </div>
          )}

          {selectedScenario === 'SUPPLIER_HIKE_20' && (
            <div>
              <label className="block text-[11px] font-medium text-gray-soft mb-1 uppercase">Target Supplier</label>
              <select
                value={targetSupplierId}
                onChange={(e) => setTargetSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory focus:outline-none focus:border-sage"
              >
                <option value="">All Trade Suppliers</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({formatINR(s.total_outstanding)})</option>
                ))}
              </select>
            </div>
          )}

          {(selectedScenario === 'UNEXPECTED_EXPENSE' || selectedScenario === 'CUSTOM_SHOCK') && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-gray-soft mb-1 uppercase">Expense Shock Amount (₹)</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full px-3 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory tabular-nums focus:outline-none focus:border-sage"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-soft mb-1 uppercase">Occurs on Day (1-30)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={expenseDayOffset}
                  onChange={(e) => setExpenseDayOffset(e.target.value)}
                  placeholder="7"
                  className="w-full px-3 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory tabular-nums focus:outline-none focus:border-sage"
                />
              </div>
            </>
          )}

          {(selectedScenario === 'MULTIPLE_CUSTOMER_DELAYS' || selectedScenario === 'CUSTOM_SHOCK') && (
            <div>
              <label className="block text-[11px] font-medium text-gray-soft mb-1 uppercase">Universal Delay (Days)</label>
              <input
                type="number"
                value={customDelayDays}
                onChange={(e) => setCustomDelayDays(e.target.value)}
                placeholder="20"
                className="w-full px-3 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory tabular-nums focus:outline-none focus:border-sage"
              />
            </div>
          )}

          {selectedScenario === 'CUSTOM_SHOCK' && (
            <div>
              <label className="block text-[11px] font-medium text-gray-soft mb-1 uppercase">Supplier Price Increase (%)</label>
              <input
                type="number"
                value={customHikePct}
                onChange={(e) => setCustomHikePct(e.target.value)}
                placeholder="15"
                className="w-full px-3 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory tabular-nums focus:outline-none focus:border-sage"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4 pt-3 border-t border-olive-muted/60">
          <button
            onClick={() => runSimulation()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sage text-midnight font-bold text-xs hover:bg-sage-hover transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>Recalculate Stress Model</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Impact Metrics */}
      {simulationResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 tabular-nums w-full min-w-0">
            <div className="bg-moss border border-olive-muted rounded-xl p-4 shadow-card min-w-0">
              <span className="text-xs text-gray-soft uppercase tracking-wider font-medium truncate block">Original Lowest Balance</span>
              <p className="text-lg sm:text-xl font-bold text-ivory mt-1 truncate">
                {formatINR(simulationResult.baseline.lowest_balance)}
              </p>
              <span className="text-[10px] text-gray-soft truncate block">
                {simulationResult.baseline.lowest_balance_date ? formatDate(simulationResult.baseline.lowest_balance_date) : 'Stable across 30 days'}
              </span>
            </div>

            <div className="bg-moss border border-crimson/30 rounded-xl p-4 shadow-card min-w-0">
              <span className="text-xs text-crimson uppercase tracking-wider font-medium truncate block">Simulated Lowest Balance</span>
              <p className="text-lg sm:text-xl font-bold text-crimson mt-1 truncate">
                {formatINR(simulationResult.simulated.lowest_balance)}
              </p>
              <span className="text-[10px] text-gray-soft truncate block">
                {simulationResult.simulated.lowest_balance_date ? formatDate(simulationResult.simulated.lowest_balance_date) : 'Stable across 30 days'}
              </span>
            </div>

            <div className="bg-moss border border-olive-muted rounded-xl p-4 shadow-card min-w-0">
              <span className="text-xs text-gray-soft uppercase tracking-wider font-medium truncate block">Liquidity Position Delta</span>
              <p className={`text-lg sm:text-xl font-bold mt-1 truncate ${simulationResult.impact.delta_lowest_balance < 0 ? 'text-crimson' : 'text-emerald'}`}>
                {simulationResult.impact.delta_lowest_balance < 0 ? '' : '+'}
                {formatINR(simulationResult.impact.delta_lowest_balance)}
              </p>
              <span className="text-[10px] text-gray-soft truncate block">Net erosion in liquidity cushion</span>
            </div>

            <div className="bg-moss border border-amber/30 rounded-xl p-4 shadow-card min-w-0">
              <span className="text-xs text-amber uppercase tracking-wider font-semibold truncate block">Reserve Buffer Gap</span>
              <p className="text-lg sm:text-xl font-bold text-amber mt-1 truncate">
                {formatINR(simulationResult.impact.additional_liquidity_required)}
              </p>
              <span className="text-[10px] text-gray-soft truncate block">Required to maintain operating buffer</span>
            </div>
          </div>

          {/* Comparative Cash Curve */}
          <div className="bg-[#202327] border border-[#383D43] rounded-xl p-5 sm:p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-ivory">Baseline vs Simulated Cash Trajectory</h3>
                <p className="text-xs text-gray-soft mt-0.5">{simulationResult.scenario_description}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-soft">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sage inline-block" />
                  <span>Baseline Position</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-crimson inline-block" />
                  <span>Simulated Shock</span>
                </div>
              </div>
            </div>

            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulationResult.comparison_timeline} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#292D32" vertical={false} />
                  <XAxis dataKey="date" stroke="#A0A5AC" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#A0A5AC"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => formatINRCompact(val)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#C77F83" strokeWidth={1.5} />
                  <Line
                    type="monotone"
                    dataKey="baseline_balance"
                    stroke="#8299AD"
                    strokeWidth={2}
                    dot={false}
                    name="Baseline"
                  />
                  <Line
                    type="monotone"
                    dataKey="simulated_balance"
                    stroke="#C77F83"
                    strokeWidth={2.5}
                    strokeDasharray="4 2"
                    dot={{ r: 2, fill: '#C77F83' }}
                    activeDot={{ r: 6, fill: '#B8BEC5' }}
                    name="Simulated Shock"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
