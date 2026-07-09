import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Status message types and configurations
 */
type StatusType = 'success' | 'error' | 'warning' | 'info';

const statusConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-800 dark:text-green-200',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

/**
 * Inline status message
 */
export const StatusMessage: React.FC<{
  type: StatusType;
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  actionButton?: React.ReactNode;
}> = ({ type, title, message, dismissible = false, onDismiss, className, actionButton }) => {
  const config = statusConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border p-4 animate-slideDown',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1">
        {title && (
          <h4 className={cn('font-semibold text-sm mb-1', config.textColor)}>
            {title}
          </h4>
        )}
        <p className={cn('text-sm', config.textColor)}>
          {message}
        </p>
      </div>
      <div className="flex items-start gap-2">
        {actionButton}
        {dismissible && (
          <button
            onClick={onDismiss}
            className={cn('p-1 hover:bg-white/20 rounded transition-colors', config.textColor)}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Loading status message
 */
export const LoadingStatus: React.FC<{
  message: string;
  subMessage?: string;
  progress?: number;
  className?: string;
}> = ({ message, subMessage, progress, className }) => {
  return (
    <div className={cn('flex flex-col gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950', className)}>
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-blue-600 animate-spin" />
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {message}
          </p>
          {subMessage && (
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {subMessage}
            </p>
          )}
        </div>
      </div>
      {progress !== undefined && (
        <div className="w-full h-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Success status message
 */
export const SuccessStatus: React.FC<{
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}> = ({ title, message, dismissible = true, onDismiss, className }) => {
  return (
    <StatusMessage
      type="success"
      title={title || 'Success'}
      message={message}
      dismissible={dismissible}
      onDismiss={onDismiss}
      className={className}
    />
  );
};

/**
 * Error status message
 */
export const ErrorStatus: React.FC<{
  title?: string;
  message: string;
  details?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}> = ({ title, message, details, dismissible = true, onDismiss, onRetry, className }) => {
  return (
    <StatusMessage
      type="error"
      title={title || 'Error'}
      message={message}
      dismissible={dismissible}
      onDismiss={onDismiss}
      className={className}
      actionButton={
        onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        )
      }
    />
  );
};

/**
 * Warning status message
 */
export const WarningStatus: React.FC<{
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}> = ({ title, message, dismissible = true, onDismiss, className }) => {
  return (
    <StatusMessage
      type="warning"
      title={title || 'Warning'}
      message={message}
      dismissible={dismissible}
      onDismiss={onDismiss}
      className={className}
    />
  );
};

/**
 * Info status message
 */
export const InfoStatus: React.FC<{
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}> = ({ title, message, dismissible = true, onDismiss, className }) => {
  return (
    <StatusMessage
      type="info"
      title={title || 'Information'}
      message={message}
      dismissible={dismissible}
      onDismiss={onDismiss}
      className={className}
    />
  );
};

/**
 * Multi-step status indicator
 */
export const StepStatus: React.FC<{
  steps: Array<{
    label: string;
    status: 'completed' | 'current' | 'pending';
  }>;
  className?: string;
}> = ({ steps, className }) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                step.status === 'completed' && 'bg-green-500 text-white',
                step.status === 'current' && 'bg-blue-500 text-white ring-2 ring-blue-300',
                step.status === 'pending' && 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              )}
            >
              {step.status === 'completed' ? '✓' : index + 1}
            </div>
            <p className="text-xs font-medium mt-2 text-center">{step.label}</p>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'h-1 flex-1 mx-2 transition-all',
                (step.status === 'completed' || step.status === 'current') ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Inline error with details
 */
export const DetailedError: React.FC<{
  error: Error | string;
  context?: string;
  onRetry?: () => void;
  className?: string;
}> = ({ error, context, onRetry, className }) => {
  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? undefined : error.stack;

  return (
    <div className={cn('rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4', className)}>
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {context && (
            <h4 className="font-semibold text-sm text-red-900 dark:text-red-100 mb-1">
              {context}
            </h4>
          )}
          <p className="text-sm text-red-800 dark:text-red-200 mb-2">
            {message}
          </p>
          {stack && (
            <details className="text-xs text-red-700 dark:text-red-300">
              <summary className="cursor-pointer font-medium hover:underline">
                Error Details
              </summary>
              <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded overflow-auto max-h-48">
                {stack}
              </pre>
            </details>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-3 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Empty state message
 */
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, description, action, className }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
};
