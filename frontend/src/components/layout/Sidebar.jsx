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
  HelpCircle
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

export function Sidebar() {
  const { activeBusiness } = useBusiness();

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Suppliers', path: '/suppliers', icon: Building2 },
    { name: 'Cash Flow Forecast', path: '/forecast', icon: TrendingUp },
    { name: 'Stress Simulator', path: '/stress-simulator', icon: Cpu },
    { name: 'AI Action Plan', path: '/ai-insights', icon: Sparkles },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-forest border-r border-olive-muted flex flex-col h-screen sticky top-0 flex-shrink-0 z-30">
      {/* Brand Logo & Tagline */}
      <div className="p-6 border-b border-olive-muted/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sage/15 border border-sage/30 flex items-center justify-center text-sage">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wider text-ivory uppercase">
              CashFlow Guardian
            </h1>
            <p className="text-[11px] text-gray-soft font-medium tracking-tight">
              Predict the Risk. Protect the Business.
            </p>
          </div>
        </div>

        {activeBusiness && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-olive/50 border border-olive-muted flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-semibold text-ivory truncate">{activeBusiness.name}</p>
              <p className="text-[10px] text-gray-soft truncate">{activeBusiness.business_type}</p>
            </div>
            {activeBusiness.is_demo && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-champagne/15 text-champagne border border-champagne/30 uppercase tracking-wider">
                DEMO
              </span>
            )}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-moss text-sage border border-sage/30 shadow-sm font-semibold'
                    : 'text-gray-soft hover:text-ivory hover:bg-olive/40'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-olive-muted/60 bg-forest/80">
        <div className="text-[11px] text-gray-soft flex items-center justify-between">
          <span>Midnight Luxe Edition</span>
          <span className="text-sage">INR ₹</span>
        </div>
      </div>
    </aside>
  );
}
