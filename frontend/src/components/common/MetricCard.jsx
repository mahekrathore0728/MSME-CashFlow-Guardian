import React from 'react';
import { StatusBadge } from './StatusBadge';

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeStatus,
  accentColor = 'default', // 'sage', 'champagne', 'crimson', 'amber'
  onClick
}) {
  const accentBorders = {
    sage: 'border-l-4 border-l-sage',
    champagne: 'border-l-4 border-l-champagne',
    crimson: 'border-l-4 border-l-crimson',
    amber: 'border-l-4 border-l-amber',
    default: 'border-olive-muted'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-moss border rounded-xl p-5 shadow-card transition-all duration-200 hover:border-olive-muted/80 ${accentBorders[accentColor] || 'border-olive-muted'} ${onClick ? 'cursor-pointer hover:bg-moss-light' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-soft">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-olive text-sage">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-ivory tabular-nums">
          {value}
        </div>
        {badge && (
          <StatusBadge status={badgeStatus || badge} label={badge} size="xs" />
        )}
      </div>

      {subtitle && (
        <div className="mt-2 text-xs text-gray-soft flex items-center gap-1.5">
          {subtitle}
        </div>
      )}
    </div>
  );
}
