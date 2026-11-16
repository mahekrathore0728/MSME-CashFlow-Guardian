import React from 'react';
import { FolderOpen } from 'lucide-react';

export function EmptyState({
  icon: Icon = FolderOpen,
  title = "No records found",
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction
}) {
  return (
    <div className="bg-moss border border-olive-muted rounded-xl p-8 sm:p-10 text-center max-w-lg mx-auto shadow-card my-6">
      <div className="w-12 h-12 mx-auto mb-3.5 rounded-lg bg-olive/50 border border-olive-muted flex items-center justify-center text-sage">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-ivory mb-1.5">{title}</h3>
      {description && (
        <p className="text-xs text-gray-soft mb-5 leading-relaxed max-w-md mx-auto">
          {description}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 rounded-lg bg-sage text-midnight font-bold text-xs hover:bg-sage-hover transition-colors shadow-sm"
          >
            {actionText}
          </button>
        )}
        {secondaryActionText && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-4 py-2 rounded-lg bg-olive/50 border border-olive-muted text-ivory font-semibold text-xs hover:border-sage/40 transition-colors"
          >
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
}
