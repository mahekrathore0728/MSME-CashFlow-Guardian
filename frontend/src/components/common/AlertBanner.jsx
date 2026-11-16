import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export function AlertBanner({ type = 'WARNING', title, message, actionText, onAction }) {
  const isCritical = type === 'CRITICAL';
  const isWarning = type === 'WARNING';
  const isSuccess = type === 'HEALTHY' || type === 'SUCCESS';

  const icons = {
    CRITICAL: AlertCircle,
    WARNING: AlertTriangle,
    HEALTHY: CheckCircle2,
    SUCCESS: CheckCircle2,
    INFO: Info
  };

  const styles = {
    CRITICAL: 'bg-crimson/10 border-crimson/30 text-crimson',
    WARNING: 'bg-amber/10 border-amber/30 text-amber',
    HEALTHY: 'bg-sage/10 border-sage/30 text-sage',
    SUCCESS: 'bg-sage/10 border-sage/30 text-sage',
    INFO: 'bg-olive border-olive-muted text-gray-soft'
  };

  const Icon = icons[type] || Info;

  return (
    <div className={`border rounded-xl p-4 flex items-start gap-3.5 shadow-subtle ${styles[type] || styles.INFO}`}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <h4 className="text-sm font-semibold tracking-wide text-ivory mb-1">{title}</h4>}
        <p className="text-xs leading-relaxed text-ivory/85">{message}</p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="text-xs font-semibold underline underline-offset-2 hover:opacity-80 flex-shrink-0 ml-2"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
