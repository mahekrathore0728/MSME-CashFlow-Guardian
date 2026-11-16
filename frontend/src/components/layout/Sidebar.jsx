import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  Building2,
  TrendingUp,
  Cpu,
  Sparkles,
  Settings,
  ShieldAlert,
  X
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

export function Sidebar({ isOpen, onClose }) {
  const { activeBusiness } = useBusiness();

  const navItems = [
    { name: 'Executive Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Customer Intelligence', path: '/customers', icon: Users },
    { name: 'Supplier Commitments', path: '/suppliers', icon: Building2 },
    { name: 'Cash Flow Forecast', path: '/forecast', icon: TrendingUp },
    { name: 'Stress Simulator', path: '/stress-simulator', icon: Cpu },
    { name: 'AI Action Plan', path: '/ai-insights', icon: Sparkles },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full w-[260px] bg-[#17191C] text-[#F1F2F3] select-none">
      {/* 1. Header Section */}
      <div className="p-4 border-b border-[#383D43] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#202327] border border-[#383D43] flex items-center justify-center text-[#8299AD] flex-shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-xs tracking-wider text-[#F1F2F3] uppercase truncate">
                CASHFLOW GUARDIAN
              </h1>
              <p className="text-[10px] text-[#A0A5AC] font-normal tracking-tight truncate">
                Predict the Risk. Protect the Business.
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-[#A0A5AC] hover:text-[#F1F2F3] hover:bg-[#292D32] transition-colors flex-shrink-0"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. Business Section */}
        <div className="mt-3 px-3 py-2 rounded-lg bg-[#202327] border border-[#383D43] flex items-center justify-between min-w-0">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-[#F1F2F3] truncate">
              {activeBusiness ? activeBusiness.name : "Sharma & Co."}
            </p>
            <p className="text-[10px] text-[#A0A5AC] truncate">
              {activeBusiness ? activeBusiness.business_type : "Wholesale Distribution"}
            </p>
          </div>
          <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#292D32] text-[#B8BEC5] border border-[#383D43] uppercase tracking-wider">
            {activeBusiness && !activeBusiness.is_demo ? "LIVE" : "SAMPLE"}
          </span>
        </div>
      </div>

      {/* 3. Navigation Section */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto bg-[#17191C]">
        <div className="px-3 pb-1.5 text-[10px] font-semibold text-[#A0A5AC] uppercase tracking-wider">
          Financial Intelligence
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose && onClose()}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-[#292D32] text-[#F1F2F3] font-semibold border-l-2 border-l-[#8299AD] border-y border-r border-[#383D43]'
                    : 'text-[#B8BEC5] hover:text-[#F1F2F3] hover:bg-[#292D32] font-medium'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0 text-[#8299AD]" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar - Fixed 100vh on Desktop */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-[260px] h-screen flex-col bg-[#17191C] border-r border-[#383D43] z-30 text-[#F1F2F3] select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Slide-over */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative w-[260px] max-w-[260px] h-full z-10 shadow-modal bg-[#17191C] border-r border-[#383D43]">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
