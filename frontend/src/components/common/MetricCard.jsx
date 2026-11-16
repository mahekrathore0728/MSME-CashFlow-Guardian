import React from 'react';
import { StatusBadge } from './StatusBadge';

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeStatus,
  accentColor = 'default',
  onClick
}) {
  const accentBorders = {
    sage: 'border-l-2 border-l-[#8299AD]',
    champagne: 'border-l-2 border-l-[#B8BEC5]',
    crimson: 'border-l-2 border-l-[#C77F83]',
    amber: 'border-l-2 border-l-[#C9A875]',
    emerald: 'border-l-2 border-l-[#8DA995]',
    default: 'border-[#383D43]'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-[#202327] border border-[#383D43] rounded-xl p-4 sm:p-5 shadow-card transition-all duration-150 h-full flex flex-col justify-between min-w-0 ${
        accentBorders[accentColor] || 'border-[#383D43]'
      } ${onClick ? 'cursor-pointer hover:border-[#8299AD]/50 hover:bg-[#25292E]' : ''}`}
    >
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-[11px] sm:text-xs font-medium text-[#A0A5AC] uppercase tracking-wider truncate">
            {title}
          </span>
          {Icon && (
            <div className="p-1.5 rounded-md bg-[#292D32] text-[#8299AD] border border-[#383D43]/60 flex-shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2 flex-wrap min-w-0">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#F1F2F3] tabular-nums break-words min-w-0">
            {value}
          </div>
          {badge && (
            <div className="flex-shrink-0">
              <StatusBadge status={badgeStatus || badge} label={badge} size="xs" />
            </div>
          )}
        </div>
      </div>

      {subtitle && (
        <div className="mt-3 pt-2.5 border-t border-[#383D43]/50 text-[11px] text-[#A0A5AC] min-w-0">
          <p className="line-clamp-2 break-words leading-tight">{subtitle}</p>
        </div>
      )}
    </div>
  );
}
