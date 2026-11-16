import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, LogOut, ChevronDown, Check, Building, RefreshCw, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';

export function Header() {
  const { user, logout } = useAuth();
  const { businesses, activeBusiness, selectBusiness, loadDemoData, demoLoading } = useBusiness();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleDemoClick = async () => {
    try {
      await loadDemoData();
      navigate('/dashboard');
    } catch (err) {
      alert("Failed to load demo dataset. Check server status.");
    }
  };

  return (
    <header className="h-16 border-b border-olive-muted bg-forest/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        {/* Business Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-olive border border-olive-muted text-xs font-medium text-ivory hover:border-sage/40 transition-colors"
          >
            <Building className="w-3.5 h-3.5 text-sage" />
            <span className="max-w-[160px] truncate">{activeBusiness ? activeBusiness.name : "Select Business"}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-soft" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-56 bg-moss border border-olive-muted rounded-xl shadow-modal py-1 z-30 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 border-b border-olive-muted text-[11px] font-semibold text-gray-soft uppercase">
                Your Businesses
              </div>
              {businesses.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-soft">No businesses found</div>
              ) : (
                businesses.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      selectBusiness(b);
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-olive transition-colors text-ivory"
                  >
                    <span className="truncate">{b.name}</span>
                    {activeBusiness?.id === b.id && <Check className="w-3.5 h-3.5 text-sage" />}
                  </button>
                ))
              )}
              <div className="border-t border-olive-muted mt-1 pt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/setup');
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-sage hover:bg-olive transition-colors font-medium"
                >
                  + Add New Business
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Load Demo Business Data Button */}
        <button
          onClick={handleDemoClick}
          disabled={demoLoading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-olive border border-champagne/40 text-champagne hover:bg-champagne/10 text-xs font-semibold tracking-wide transition-colors disabled:opacity-50"
          title="Fictional business dataset with reconciled customers, suppliers, and transactions"
        >
          {demoLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Database className="w-3.5 h-3.5" />
          )}
          <span>Load Demo Business Data</span>
        </button>

        {/* User profile & logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-olive-muted">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-medium text-ivory">{user?.full_name || user?.email}</span>
            <span className="text-[10px] text-gray-soft">Business Owner</span>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg text-gray-soft hover:text-crimson hover:bg-olive transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
