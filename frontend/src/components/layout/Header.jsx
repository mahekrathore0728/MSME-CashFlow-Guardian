import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Database,
  LogOut,
  ChevronDown,
  Check,
  Building,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';

export function Header({ onToggleMobileMenu }) {
  const { user, logout } = useAuth();
  const { businesses, activeBusiness, selectBusiness, loadDemoData, demoLoading } = useBusiness();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSampleClick = async () => {
    try {
      await loadDemoData();
      navigate('/dashboard');
    } catch (err) {
      alert("Failed to load sample dataset. Please check server connection.");
    }
  };

  return (
    <header className="h-16 border-b border-[#383D43] bg-[#17191C] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 w-full min-w-0">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle Button */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-[#A0A5AC] hover:text-[#F1F2F3] hover:bg-[#292D32] transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Business Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#202327] border border-[#383D43] text-xs font-medium text-[#F1F2F3] hover:border-[#8299AD] transition-colors"
            aria-expanded={dropdownOpen}
          >
            <Building className="w-3.5 h-3.5 text-[#8299AD] flex-shrink-0" />
            <span className="max-w-[140px] sm:max-w-[200px] truncate">
              {activeBusiness ? activeBusiness.name : "Select Business"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#A0A5AC] flex-shrink-0" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-64 bg-[#202327] border border-[#383D43] rounded-xl shadow-modal py-1.5 z-30 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-[#383D43] text-[10px] font-semibold text-[#A0A5AC] uppercase tracking-wider">
                  Configured Enterprises
                </div>
                {businesses.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-[#A0A5AC]">No businesses registered</div>
                ) : (
                  <div className="max-h-56 overflow-y-auto divide-y divide-[#383D43]/40">
                    {businesses.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          selectBusiness(b);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#292D32] transition-colors ${
                          activeBusiness?.id === b.id ? 'text-[#F1F2F3] font-semibold bg-[#292D32]' : 'text-[#A0A5AC]'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="truncate text-[#F1F2F3]">{b.name}</p>
                          <p className="text-[10px] text-[#A0A5AC]">{b.business_type}</p>
                        </div>
                        {activeBusiness?.id === b.id && (
                          <Check className="w-3.5 h-3.5 text-[#8299AD] flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <div className="border-t border-[#383D43] mt-1 pt-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/setup');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#8299AD] hover:bg-[#292D32] transition-colors font-medium flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Configure New Business</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Controls: Sample Data Button & User Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Load Sample Data Button */}
        <button
          onClick={handleSampleClick}
          disabled={demoLoading}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#202327] border border-[#383D43] text-[#B8BEC5] hover:bg-[#292D32] hover:text-[#F1F2F3] text-xs font-medium tracking-wide transition-colors disabled:opacity-50"
          title="Fictional sample dataset with pre-reconciled customers, suppliers, and cash transactions"
        >
          {demoLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Database className="w-3.5 h-3.5 text-[#8299AD]" />
          )}
          <span className="hidden sm:inline">Load Sample Data</span>
          <span className="sm:hidden">Sample Data</span>
        </button>

        {/* User profile & logout */}
        <div className="flex items-center gap-2.5 pl-2.5 sm:pl-3 border-l border-[#383D43]">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-[#F1F2F3] max-w-[140px] truncate">
              {user?.full_name || user?.email}
            </span>
            <span className="text-[10px] text-[#A0A5AC]">Enterprise Admin</span>
          </div>

          <button
            onClick={logout}
            className="p-1.5 sm:p-2 rounded-lg text-[#A0A5AC] hover:text-[#C77F83] hover:bg-[#292D32] transition-colors flex items-center gap-1"
            title="Log out of session"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
