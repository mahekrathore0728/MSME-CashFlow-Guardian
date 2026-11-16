import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[#111214] text-[#F1F2F3] selection:bg-[#8299AD] selection:text-[#111214] overflow-x-hidden">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Layout with 260px left offset on desktop */}
      <div className="md:pl-[260px] flex flex-col min-h-screen min-w-0 w-full bg-[#111214]">
        <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto min-w-0 bg-[#111214]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
