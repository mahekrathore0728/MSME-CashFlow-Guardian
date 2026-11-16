import React from 'react';
import { FolderOpen } from 'lucide-react';

export function EmptyState({
  icon: Icon = FolderOpen,
  title = "No data recorded yet",
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction
}) {
  return (
    <div className="bg-moss border border-olive-muted rounded-2xl p-10 text-center max-w-lg mx-auto shadow-card my-8">
      <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-olive flex items-center justify-center text-sage">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-ivory mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-soft mb-6 leading-relaxed">
          {description}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2.5 rounded-lg bg-sage text-midnight font-medium text-sm hover:bg-sage-hover transition-colors shadow-sm"
          >
            {actionText}
          </button>
        )}
        {secondaryActionText && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-4 py-2.5 rounded-lg bg-olive border border-olive-muted text-ivory font-medium text-sm hover:border-sage/40 transition-colors"
          >
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
}
