import React from 'react';

export function StatusBadge({ status, label, size = 'sm' }) {
  const norm = (status || label || '').toUpperCase();
  
  let styles = 'bg-[#292D32] text-[#A0A5AC] border-[#383D43]';
  
  if (norm === 'LOW' || norm === 'LOW RISK' || norm === 'HEALTHY' || norm === 'PAID' || norm === 'CONFIRMED') {
    styles = 'bg-[#292D32] text-[#8DA995] border-[#8DA995]/40';
  } else if (norm === 'MODERATE' || norm === 'MODERATE RISK' || norm === 'WARNING' || norm === 'PARTIALLY_PAID' || norm === 'EXPECTED') {
    styles = 'bg-[#292D32] text-[#C9A875] border-[#C9A875]/40';
  } else if (norm === 'HIGH' || norm === 'HIGH RISK' || norm === 'CRITICAL' || norm === 'OVERDUE' || norm === 'UNCERTAIN') {
    styles = 'bg-[#292D32] text-[#C77F83] border-[#C77F83]/40';
  } else if (norm === 'INSUFFICIENT' || norm === 'INSUFFICIENT DATA' || norm === 'UNKNOWN' || norm === 'UNPAID') {
    styles = 'bg-[#292D32] text-[#A0A5AC] border-[#383D43]';
  }

  const padding = size === 'xs' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center rounded-md border tracking-wide uppercase ${padding} ${styles}`}>
      {label || status}
    </span>
  );
}
