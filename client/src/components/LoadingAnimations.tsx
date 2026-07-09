import React from 'react';
import { Spinner } from './ui/spinner';
import { cn } from '@/lib/utils';

/**
 * Smooth fade-in loading spinner with optional text
 */
export const LoadingSpinner: React.FC<{
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}> = ({ text, size = 'md', fullScreen = false, className }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullScreen && 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50',
        !fullScreen && 'py-12',
        className
      )}
    >
      <div className="animate-spin">
        <Spinner className={sizeClasses[size]} />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

/**
 * Skeleton loading for cards and content
 */
export const SkeletonLoader: React.FC<{
  count?: number;
  type?: 'card' | 'list' | 'table';
  className?: string;
}> = ({ count = 3, type = 'card', className }) => {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <div className={cn('grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3', className)}>
        {items.map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 overflow-hidden animate-pulse"
          >
            <div className="aspect-[16/10] bg-muted" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/3" />
              <div className="flex gap-2">
                <div className="h-3 bg-muted rounded w-12" />
                <div className="h-3 bg-muted rounded w-12" />
                <div className="h-3 bg-muted rounded w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        {items.map((_, i) => (
          <div
            key={i}
            className="h-16 bg-muted rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={cn('space-y-2', className)}>
        {items.map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1 h-12 bg-muted rounded animate-pulse" />
            <div className="flex-1 h-12 bg-muted rounded animate-pulse" />
            <div className="flex-1 h-12 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return null;
};

/**
 * Progress bar with animated gradient
 */
export const ProgressBar: React.FC<{
  progress: number;
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}> = ({ progress, label, showPercentage = true, animated = true, className }) => {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {showPercentage && (
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500',
            animated && 'animate-pulse'
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Shimmer effect for skeleton loading
 */
export const ShimmerLoader: React.FC<{
  width?: string;
  height?: string;
  className?: string;
}> = ({ width = 'w-full', height = 'h-12', className }) => {
  return (
    <div
      className={cn(
        width,
        height,
        'bg-gradient-to-r from-muted via-background to-muted rounded-lg',
        'animate-shimmer',
        className
      )}
      style={{
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite',
      }}
    />
  );
};

/**
 * Pulse animation for status indicators
 */
export const PulseIndicator: React.FC<{
  status: 'loading' | 'success' | 'error' | 'warning';
  text?: string;
  className?: string;
}> = ({ status, text, className }) => {
  const statusColors = {
    loading: 'bg-blue-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
  };

  const statusTexts = {
    loading: 'Processing...',
    success: 'Complete',
    error: 'Error',
    warning: 'Warning',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('w-3 h-3 rounded-full', statusColors[status], status === 'loading' && 'animate-pulse')} />
      <span className="text-sm text-muted-foreground">
        {text || statusTexts[status]}
      </span>
    </div>
  );
};

/**
 * Animated data loading card
 */
export const DataLoadingCard: React.FC<{
  title?: string;
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ title, isLoading, children, className }) => {
  return (
    <div className={cn('rounded-lg border border-border p-4', className)}>
      {title && (
        <h3 className="text-sm font-semibold mb-4 text-foreground">{title}</h3>
      )}
      {isLoading ? (
        <SkeletonLoader count={1} type="list" />
      ) : (
        <div className="animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Staggered list item animation
 */
export const AnimatedListItem: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className }) => {
  return (
    <div
      className={cn('animate-slideUp', className)}
      style={{
        animationDelay: `${delay * 100}ms`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Fade in animation wrapper
 */
export const FadeInAnimation: React.FC<{
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}> = ({ children, duration = 300, delay = 0, className }) => {
  return (
    <div
      className={cn('animate-fadeIn', className)}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Slide in animation wrapper
 */
export const SlideInAnimation: React.FC<{
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  delay?: number;
  className?: string;
}> = ({ children, direction = 'up', duration = 300, delay = 0, className }) => {
  const animationClass = {
    up: 'animate-slideUp',
    down: 'animate-slideDown',
    left: 'animate-slideLeft',
    right: 'animate-slideRight',
  }[direction];

  return (
    <div
      className={cn(animationClass, className)}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Bounce animation for alerts
 */
export const BounceAnimation: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn('animate-bounce', className)}>
      {children}
    </div>
  );
};

/**
 * Scale animation for emphasis
 */
export const ScaleAnimation: React.FC<{
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}> = ({ children, duration = 300, delay = 0, className }) => {
  return (
    <div
      className={cn('animate-scaleIn', className)}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};
