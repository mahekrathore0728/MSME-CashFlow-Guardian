import React from 'react';

export function StatusBadge({ status, label, size = 'sm' }) {
  const norm = (status || label || '').toUpperCase();
  
  let styles = 'bg-olive text-gray-soft border-olive-muted';
  
  if (norm === 'LOW' || norm === 'LOW RISK' || norm === 'HEALTHY' || norm === 'PAID' || norm === 'CONFIRMED') {
    styles = 'bg-sage/15 text-sage border-sage/30';
  } else if (norm === 'MODERATE' || norm === 'MODERATE RISK' || norm === 'WARNING' || norm === 'PARTIALLY_PAID' || norm === 'EXPECTED') {
    styles = 'bg-amber/15 text-amber border-amber/30';
  } else if (norm === 'HIGH' || norm === 'HIGH RISK' || norm === 'CRITICAL' || norm === 'OVERDUE' || norm === 'UNCERTAIN') {
    styles = 'bg-crimson/15 text-crimson border-crimson/30';
  } else if (norm === 'INSUFFICIENT' || norm === 'INSUFFICIENT DATA' || norm === 'UNKNOWN' || norm === 'UNPAID') {
    styles = 'bg-olive text-gray-soft border-olive-muted';
  }

  const padding = size === 'xs' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center rounded-md border tracking-wide uppercase ${padding} ${styles}`}>
      {label || status}
    </span>
  );
}
