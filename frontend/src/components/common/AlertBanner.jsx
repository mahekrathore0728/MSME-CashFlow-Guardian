import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export function AlertBanner({ type = 'WARNING', title, message, actionText, onAction }) {
  const icons = {
    CRITICAL: AlertCircle,
    WARNING: AlertTriangle,
    HEALTHY: CheckCircle2,
    SUCCESS: CheckCircle2,
    INFO: Info
  };

  const borderAccents = {
    CRITICAL: 'border-l-4 border-l-[#C77F83] bg-[#202327] border-[#383D43] text-[#C77F83]',
    WARNING: 'border-l-4 border-l-[#C9A875] bg-[#202327] border-[#383D43] text-[#C9A875]',
    HEALTHY: 'border-l-4 border-l-[#8DA995] bg-[#202327] border-[#383D43] text-[#8DA995]',
    SUCCESS: 'border-l-4 border-l-[#8DA995] bg-[#202327] border-[#383D43] text-[#8DA995]',
    INFO: 'border-l-4 border-l-[#8299AD] bg-[#202327] border-[#383D43] text-[#8299AD]'
  };

  const Icon = icons[type] || Info;

  return (
    <div
      className={`border rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle w-full min-w-0 ${
        borderAccents[type] || borderAccents.INFO
      }`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 min-w-0">
            {title && (
              <span className="text-xs font-semibold text-[#F1F2F3] tracking-wide flex-shrink-0">
                {title}:
              </span>
            )}
            <span className="text-xs text-[#A0A5AC] leading-normal break-words min-w-0">
              {message}
            </span>
          </div>
        </div>
      </div>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="text-xs font-semibold text-[#8299AD] hover:text-[#F1F2F3] px-2.5 py-1 rounded bg-[#292D32] hover:bg-[#383D43] border border-[#383D43] flex-shrink-0 self-start sm:self-center transition-colors whitespace-nowrap"
        >
          {actionText} →
        </button>
      )}
    </div>
  );
}
