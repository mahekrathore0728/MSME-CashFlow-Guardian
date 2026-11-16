import React, { useState, useEffect } from 'react';
import {
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  X
} from 'lucide-react';
import api from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { formatINR } from '../utils/currency';
import { formatDate, getCurrentISODate } from '../utils/dates';

export function TransactionsPage() {
  const { activeBusiness } = useBusiness();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');

  // Add Transaction Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    transaction_date: getCurrentISODate(),
    amount: '',
    direction: 'INFLOW',
    transaction_type: 'CUSTOMER_COLLECTION',
    description: '',
    payment_mode: 'Bank Transfer (NEFT/RTGS)',
    reference_number: '',
    category: 'Trade Operations'
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // CSV Import Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.transaction_type = typeFilter;
      if (directionFilter) params.direction = directionFilter;

      const res = await api.get('/transactions', { params });
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusiness) {
      fetchTransactions();
    }
  }, [activeBusiness, search, typeFilter, directionFilter]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    try {
      await api.post('/transactions', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setIsAddModalOpen(false);
      setFormData({
        transaction_date: getCurrentISODate(),
        amount: '',
        direction: 'INFLOW',
        transaction_type: 'CUSTOMER_COLLECTION',
        description: '',
        payment_mode: 'Bank Transfer (NEFT/RTGS)',
        reference_number: '',
        category: 'Trade Operations'
      });
      fetchTransactions();
    } catch (err) {
      setAddError(err.response?.data?.detail || "Failed to record transaction.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction record? Bank balance will recalculate immediately.")) {
      return;
    }
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      alert("Failed to delete transaction.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadError('');
    }
  };

  const handlePreviewUpload = async () => {
    if (!uploadFile) return;
    setUploadLoading(true);
    setUploadError('');
    const form = new FormData();
    form.append('file', uploadFile);

    try {
      const res = await api.post('/transactions/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewData(res.data);
    } catch (err) {
      setUploadError(err.response?.data?.detail || "Failed to parse CSV file. Ensure valid columns.");
    } finally {
      setUploadLoading(false);
    }
  };

  const toggleItemSelection = (index) => {
    if (!previewData) return;
    const updated = [...previewData.items];
    updated[index].selected = !updated[index].selected;
    setPreviewData({ ...previewData, items: updated });
  };

  const handleCommitImport = async () => {
    if (!previewData || !previewData.items) return;
    setCommitLoading(true);
    try {
      const selectedItems = previewData.items.filter(i => i.selected);
      const res = await api.post('/transactions/commit-import', { items: selectedItems });
      setUploadSuccess(res.data.message);
      fetchTransactions();
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setPreviewData(null);
        setUploadSuccess('');
      }, 1500);
    } catch (err) {
      setUploadError("Failed to save imported records.");
    } finally {
      setCommitLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/transactions/export', '_blank');
  };

  const handleDownloadSample = () => {
    window.open('/api/transactions/sample-csv', '_blank');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ivory">
            Transactions Ledger
          </h1>
          <p className="text-xs text-gray-soft mt-1">
            Reconciled bank movements, customer settlements, and operational cash disbursements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-olive/50 border border-olive-muted text-ivory font-semibold text-xs hover:border-sage/40 transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-sage" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-olive/50 border border-olive-muted text-gray-soft hover:text-ivory font-medium text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-sage text-midnight font-bold text-xs tracking-wide hover:bg-sage-hover transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#202327] border border-[#383D43] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-3 shadow-card">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#A0A5AC]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search descriptions, UTR numbers, or parties..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#292D32] border border-[#383D43] text-xs text-[#F1F2F3] placeholder:text-[#A0A5AC]/50 focus:outline-none focus:border-[#8299AD] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#292D32] border border-[#383D43] text-xs text-[#F1F2F3] focus:outline-none focus:border-[#8299AD] transition-colors flex-1 sm:flex-initial"
          >
            <option value="">All Categories</option>
            <option value="CUSTOMER_COLLECTION">Customer Collection</option>
            <option value="SUPPLIER_PAYMENT">Supplier Payment</option>
            <option value="PAYROLL">Payroll / Salaries</option>
            <option value="RENT">Rent / Lease</option>
            <option value="UTILITIES">Utilities / Power</option>
            <option value="EXPENSE">General Expense</option>
            <option value="INCOME">Other Income</option>
          </select>

          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#292D32] border border-[#383D43] text-xs text-[#F1F2F3] focus:outline-none focus:border-[#8299AD] transition-colors flex-1 sm:flex-initial"
          >
            <option value="">All Directions</option>
            <option value="INFLOW">Inflows Only (+)</option>
            <option value="OUTFLOW">Outflows Only (-)</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#202327] border border-[#383D43] rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-xs text-gray-soft">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sage mb-2" />
            Loading transaction ledger...
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="No transactions match your current search and filter criteria. Record a transaction or import your bank statement CSV to populate the ledger."
            actionText="Record First Transaction"
            onAction={() => setIsAddModalOpen(true)}
            secondaryActionText="Import Bank Statement CSV"
            onSecondaryAction={() => setIsUploadModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-olive-muted bg-olive/40 text-gray-soft font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Payment Mode / Ref</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-olive-muted/60">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-olive/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-gray-soft whitespace-nowrap">
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td className="py-3 px-4 font-medium text-ivory max-w-sm">
                        <div className="truncate font-semibold">{tx.description}</div>
                        {(tx.customer_name || tx.supplier_name) && (
                          <div className="text-[10px] text-gray-soft">
                            Party: {tx.customer_name || tx.supplier_name}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-olive/60 text-gray-soft border border-olive-muted text-[10px] font-medium">
                          {tx.transaction_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-soft whitespace-nowrap">
                        <div>{tx.payment_mode || 'Bank Transfer'}</div>
                        {tx.reference_number && (
                          <div className="text-[10px] font-mono text-gray-muted truncate max-w-[120px]">
                            {tx.reference_number}
                          </div>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold tabular-nums whitespace-nowrap ${
                        tx.direction === 'INFLOW' ? 'text-emerald' : 'text-crimson'
                      }`}>
                        {tx.direction === 'INFLOW' ? '+' : '-'} {formatINR(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 rounded-md text-gray-soft hover:text-crimson hover:bg-olive transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Manual Add Transaction Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Financial Transaction"
      >
        {addError && (
          <div className="p-3 rounded-lg bg-crimson/10 border border-crimson/25 text-crimson text-xs">
            {addError}
          </div>
        )}

        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-soft mb-1 uppercase tracking-wider">
                Direction
              </label>
              <select
                value={formData.direction}
                onChange={(e) => {
                  const dir = e.target.value;
                  setFormData({
                    ...formData,
                    direction: dir,
                    transaction_type: dir === 'INFLOW' ? 'CUSTOMER_COLLECTION' : 'SUPPLIER_PAYMENT'
                  });
                }}
                className="w-full px-3 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory focus:outline-none focus:border-sage"
              >
                <option value="INFLOW">INFLOW (Money Received)</option>
                <option value="OUTFLOW">OUTFLOW (Money Paid Out)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-soft mb-1 uppercase tracking-wider">
                Transaction Type
              </label>
              <select
                value={formData.transaction_type}
                onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory focus:outline-none focus:border-sage"
              >
                {formData.direction === 'INFLOW' ? (
                  <>
                    <option value="CUSTOMER_COLLECTION">Customer Collection</option>
                    <option value="INCOME">Other Operating Income</option>
                  </>
                ) : (
                  <>
                    <option value="SUPPLIER_PAYMENT">Supplier Payment</option>
                    <option value="PAYROLL">Payroll / Salaries</option>
                    <option value="RENT">Rent / Lease</option>
                    <option value="UTILITIES">Utilities & Power</option>
                    <option value="EXPENSE">General Operating Expense</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-soft mb-1 uppercase tracking-wider">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="50000.00"
                className="w-full px-3 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory tabular-nums focus:outline-none focus:border-sage"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-soft mb-1 uppercase tracking-wider">
                Transaction Date
              </label>
              <input
                type="date"
                required
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory focus:outline-none focus:border-sage"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-soft mb-1 uppercase tracking-wider">
              Description / Narration
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Settlement for INV-004 from Verma Distributors"
              className="w-full px-3 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory focus:outline-none focus:border-sage"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-soft mb-1 uppercase tracking-wider">
                Payment Mode
              </label>
              <select
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory focus:outline-none focus:border-sage"
              >
                <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-soft mb-1 uppercase tracking-wider">
                Reference / UTR Number
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="UTR / Cheque No."
                className="w-full px-3 py-2 rounded-lg bg-olive/50 border border-olive-muted text-xs text-ivory focus:outline-none focus:border-sage font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-olive-muted/60">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-olive/50 text-gray-soft hover:text-ivory text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addLoading}
              className="px-4 py-2 rounded-lg bg-sage text-midnight font-bold text-xs hover:bg-sage-hover disabled:opacity-50 transition-colors shadow-sm"
            >
              {addLoading ? "Saving..." : "Record Transaction"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Smart CSV Ingestion Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Smart Financial Data Ingestion (CSV)"
        maxWidth="max-w-4xl"
      >
        {uploadError && (
          <div className="p-3 rounded-lg bg-crimson/10 border border-crimson/25 text-crimson text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3 rounded-lg bg-emerald/10 border border-emerald/25 text-emerald text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {!previewData ? (
          <div className="space-y-4">
            <div className="border border-dashed border-olive-muted rounded-xl p-8 text-center hover:border-sage/40 transition-colors bg-olive/20">
              <FileSpreadsheet className="w-10 h-10 text-sage mx-auto mb-3" />
              <h4 className="text-xs sm:text-sm font-semibold text-ivory mb-1">
                Upload Bank Statement or Tally CSV
              </h4>
              <p className="text-xs text-gray-soft max-w-md mx-auto mb-4">
                Supported formats: Bank Statement CSV, Tally Voucher Export, or Standard CashFlow Guardian format.
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block mx-auto text-xs text-gray-soft file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sage file:text-midnight hover:file:bg-sage-hover cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-soft px-1">
              <span>Need a reference template?</span>
              <button
                onClick={handleDownloadSample}
                className="text-sage hover:underline flex items-center gap-1 font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-olive-muted/60">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-olive/50 text-gray-soft hover:text-ivory text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!uploadFile || uploadLoading}
                onClick={handlePreviewUpload}
                className="px-4 py-2 rounded-lg bg-sage text-midnight font-bold text-xs hover:bg-sage-hover disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
              >
                {uploadLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Validate & Preview CSV</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-olive/50 border border-olive-muted text-xs">
              <div>
                <span className="font-semibold text-ivory">Parsed {previewData.valid_rows} valid records </span>
                <span className="text-gray-soft">({previewData.duplicate_count} duplicates flagged)</span>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                className="text-xs text-sage hover:underline"
              >
                Upload Different File
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto border border-olive-muted rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-olive/60 sticky top-0 text-[10px] uppercase text-gray-soft border-b border-olive-muted">
                  <tr>
                    <th className="py-2.5 px-3 text-center">Import</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-olive-muted/60">
                  {previewData.items.map((item, idx) => (
                    <tr key={idx} className={`hover:bg-olive/30 ${item.is_duplicate ? 'opacity-50' : ''}`}>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleItemSelection(idx)}
                          className="rounded border-olive-muted text-sage focus:ring-0"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-soft">{item.formatted_date}</td>
                      <td className="py-2.5 px-3 truncate max-w-xs text-ivory">{item.description}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-olive text-gray-soft text-[10px]">
                          {item.transaction_type}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${item.direction === 'INFLOW' ? 'text-emerald' : 'text-crimson'}`}>
                        {item.direction === 'INFLOW' ? '+' : '-'}{formatINR(item.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.is_duplicate ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber/15 text-amber">
                            Duplicate
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald/15 text-emerald">
                            Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-olive-muted/60">
              <span className="text-xs text-gray-soft">
                {previewData.items.filter(i => i.selected).length} records selected
              </span>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-olive/50 text-gray-soft hover:text-ivory text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={commitLoading || previewData.items.filter(i => i.selected).length === 0}
                  onClick={handleCommitImport}
                  className="px-4 py-2 rounded-lg bg-sage text-midnight font-bold text-xs hover:bg-sage-hover disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
                >
                  {commitLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Commit Records to Ledger</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
