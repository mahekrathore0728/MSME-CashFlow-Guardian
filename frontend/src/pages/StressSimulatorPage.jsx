import React, { useState, useEffect } from 'react';
import {
  Cpu,
  AlertTriangle,
  Play,
  RotateCcw,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
  Info,
  DollarSign,
  CheckCircle2,
  RefreshCw
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

  // Simulation State
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

  // Fetch customers and suppliers for target dropdowns
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

  // Custom Comparison Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      return (
        <div className="bg-moss border border-olive-muted rounded-xl p-3.5 shadow-modal text-xs">
          <p className="font-semibold text-ivory mb-2 pb-1 border-b border-olive-muted">{label}</p>
          <div className="space-y-1.5 tabular-nums">
            <p className="text-sage flex justify-between gap-4">
              <span>Baseline Balance:</span>
              <span className="font-bold">{formatINR(pData.baseline_balance)}</span>
            </p>
            <p className="text-crimson flex justify-between gap-4">
              <span>Simulated Balance:</span>
              <span className="font-bold">{formatINR(pData.simulated_balance)}</span>
            </p>
            <p className="text-gray-soft flex justify-between gap-4 pt-1 border-t border-olive-muted">
              <span>Variance:</span>
              <span className={pData.variance < 0 ? 'text-crimson font-medium' : 'text-sage'}>
                {formatINR(pData.variance)}
              </span>
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ivory">
          Interactive What-If Stress Simulator
        </h1>
        <p className="text-xs text-gray-soft mt-1">
          Apply empirical shocks to evaluate working capital resilience before making real commitments. Original financial records remain 100% unaltered.
        </p>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {[
          { id: 'CUSTOMER_DELAY_15', label: '15-Day Customer Delay' },
          { id: 'CUSTOMER_DELAY_30', label: '30-Day Customer Delay' },
          { id: 'SUPPLIER_HIKE_20', label: 'Supplier +20% Price Hike' },
          { id: 'UNEXPECTED_EXPENSE', label: 'Emergency Expense' },
          { id: 'PARTIAL_PAYMENT_50', label: '50% Customer Haircut' },
          { id: 'MULTIPLE_CUSTOMER_DELAYS', label: 'Systemic Delays' },
          { id: 'CUSTOM_SHOCK', label: 'Custom Composite' },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => handleScenarioChange(s.id)}
            className={`p-3 rounded-xl border text-left transition-all text-xs font-semibold ${
              selectedScenario === s.id
                ? 'bg-moss border-sage text-sage shadow-card'
                : 'bg-olive/40 border-olive-muted text-gray-soft hover:text-ivory hover:bg-olive'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Parameter Controls for Active Scenario */}
      <div className="bg-moss border border-olive-muted rounded-2xl p-5 shadow-card">
        <h3 className="text-xs font-semibold text-gray-soft uppercase tracking-wider mb-3">
          Configure Scenario Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(selectedScenario === 'CUSTOMER_DELAY_15' || selectedScenario === 'CUSTOMER_DELAY_30' || selectedScenario === 'PARTIAL_PAYMENT_50' || selectedScenario === 'CUSTOM_SHOCK') && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-soft mb-1 uppercase">Target Customer</label>
              <select
                value={targetCustomerId}
                onChange={(e) => setTargetCustomerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-olive border border-olive-muted text-xs text-ivory focus:outline-none focus:border-sage"
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
              <label className="block text-[11px] font-semibold text-gray-soft mb-1 uppercase">Target Supplier</label>
              <select
                value={targetSupplierId}
                onChange={(e) => setTargetSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-olive border border-olive-muted text-xs text-ivory focus:outline-none focus:border-sage"
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
                <label className="block text-[11px] font-semibold text-gray-soft mb-1 uppercase">Expense Shock Amount (₹)</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full px-3 py-2 rounded-xl bg-olive border border-olive-muted text-xs text-ivory tabular-nums focus:outline-none focus:border-sage"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-soft mb-1 uppercase">Occurs on Day (1-30)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={expenseDayOffset}
                  onChange={(e) => setExpenseDayOffset(e.target.value)}
                  placeholder="7"
                  className="w-full px-3 py-2 rounded-xl bg-olive border border-olive-muted text-xs text-ivory tabular-nums focus:outline-none focus:border-sage"
                />
              </div>
            </>
          )}

          {(selectedScenario === 'MULTIPLE_CUSTOMER_DELAYS' || selectedScenario === 'CUSTOM_SHOCK') && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-soft mb-1 uppercase">Universal Delay Days</label>
              <input
                type="number"
                value={customDelayDays}
                onChange={(e) => setCustomDelayDays(e.target.value)}
                placeholder="20"
                className="w-full px-3 py-2 rounded-xl bg-olive border border-olive-muted text-xs text-ivory tabular-nums focus:outline-none focus:border-sage"
              />
            </div>
          )}

          {selectedScenario === 'CUSTOM_SHOCK' && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-soft mb-1 uppercase">Supplier Cost Increase (%)</label>
              <input
                type="number"
                value={customHikePct}
                onChange={(e) => setCustomHikePct(e.target.value)}
                placeholder="15"
                className="w-full px-3 py-2 rounded-xl bg-olive border border-olive-muted text-xs text-ivory tabular-nums focus:outline-none focus:border-sage"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4 pt-3 border-t border-olive-muted">
          <button
            onClick={() => runSimulation()}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-sage text-midnight font-bold text-xs hover:bg-sage-hover transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>Recalculate Stress Model</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Impact Metrics */}
      {simulationResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
            <div className="bg-moss border border-olive-muted rounded-xl p-4 shadow-card">
              <span className="text-xs text-gray-soft">Original Lowest Balance</span>
              <p className="text-xl font-bold text-ivory mt-1">
                {formatINR(simulationResult.baseline.lowest_balance)}
              </p>
              <span className="text-[10px] text-gray-soft">
                {simulationResult.baseline.lowest_balance_date ? formatDate(simulationResult.baseline.lowest_balance_date) : 'Stable'}
              </span>
            </div>

            <div className="bg-moss border border-crimson/30 rounded-xl p-4 shadow-card">
              <span className="text-xs text-crimson font-medium">Simulated Lowest Balance</span>
              <p className="text-xl font-bold text-crimson mt-1">
                {formatINR(simulationResult.simulated.lowest_balance)}
              </p>
              <span className="text-[10px] text-gray-soft">
                {simulationResult.simulated.lowest_balance_date ? formatDate(simulationResult.simulated.lowest_balance_date) : 'Stable'}
              </span>
            </div>

            <div className="bg-moss border border-olive-muted rounded-xl p-4 shadow-card">
              <span className="text-xs text-gray-soft">Cash Position Delta</span>
              <p className={`text-xl font-bold mt-1 ${simulationResult.impact.delta_lowest_balance < 0 ? 'text-crimson' : 'text-sage'}`}>
                {simulationResult.impact.delta_lowest_balance < 0 ? '' : '+'}
                {formatINR(simulationResult.impact.delta_lowest_balance)}
              </p>
              <span className="text-[10px] text-gray-soft">Net erosion in liquidity</span>
            </div>

            <div className="bg-moss border border-amber/40 rounded-xl p-4 shadow-card">
              <span className="text-xs text-amber font-semibold">Additional Liquidity Required</span>
              <p className="text-xl font-bold text-amber mt-1">
                {formatINR(simulationResult.impact.additional_liquidity_required)}
              </p>
              <span className="text-[10px] text-gray-soft">To maintain safety reserve</span>
            </div>
          </div>

          {/* Side-by-Side Comparative Cash Curve */}
          <div className="bg-moss border border-olive-muted rounded-2xl p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-semibold text-ivory">Baseline vs Simulated Cash Trajectory</h3>
                <p className="text-xs text-gray-soft mt-0.5">{simulationResult.scenario_description}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-soft">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sage inline-block" />
                  <span>Baseline Position</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-crimson inline-block" />
                  <span>Simulated Shock</span>
                </div>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulationResult.comparison_timeline} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252F29" vertical={false} />
                  <XAxis dataKey="date" stroke="#717C71" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#717C71"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => formatINRCompact(val)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#D66B70" strokeWidth={1.5} />
                  <Line
                    type="monotone"
                    dataKey="baseline_balance"
                    stroke="#A3B89A"
                    strokeWidth={2}
                    dot={false}
                    name="Baseline"
                  />
                  <Line
                    type="monotone"
                    dataKey="simulated_balance"
                    stroke="#D66B70"
                    strokeWidth={2.5}
                    strokeDasharray="4 2"
                    dot={{ r: 2, fill: '#D66B70' }}
                    activeDot={{ r: 6, fill: '#C6A96B' }}
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
