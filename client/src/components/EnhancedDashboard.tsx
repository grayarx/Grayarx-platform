import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { LoadingSpinner, SkeletonLoader, DataLoadingCard, FadeInAnimation, SlideInAnimation } from './LoadingAnimations';
import { LoadingStatus, SuccessStatus, ErrorStatus, EmptyState } from './StatusMessages';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Enhanced Dashboard with loading animations and status messages
 */
export const EnhancedDashboard: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { user } = useAuth();
  const authLoading = false;
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dataLoading, error: dataError, refetch } = trpc.dashboard.getKPIs.useQuery(
    { dealershipId: user?.id?.toString() || '', period: 'month' },
    { enabled: !!user?.id }
  );

  // Handle data loading states
  useEffect(() => {
    if (dataError) {
      setStatusMessage({
        type: 'error',
        title: 'Failed to Load Dashboard',
        message: 'Could not fetch dashboard data. Please try again.',
      });
    }
  }, [dataError]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setStatusMessage({
        type: 'success',
        message: 'Dashboard updated successfully',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        message: 'Failed to refresh dashboard',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show loading state
  if (authLoading) {
    return <LoadingSpinner text="Loading dashboard..." fullScreen />;
  }

  if (!user) {
    return (
      <EmptyState
        title="Not Authenticated"
        description="Please log in to view your dashboard"
      />
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Status Messages */}
      {statusMessage && (
        <FadeInAnimation>
          {statusMessage.type === 'success' && (
            <SuccessStatus
              title={statusMessage.title}
              message={statusMessage.message}
              onDismiss={() => setStatusMessage(null)}
            />
          )}
          {statusMessage.type === 'error' && (
            <ErrorStatus
              title={statusMessage.title}
              message={statusMessage.message}
              onRetry={handleRefresh}
              onDismiss={() => setStatusMessage(null)}
            />
          )}
        </FadeInAnimation>
      )}

      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name || 'User'}</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Loading State */}
      {dataLoading && (
        <LoadingStatus
          message="Loading your dashboard..."
          subMessage="This may take a few moments"
          progress={50}
        />
      )}

      {/* Dashboard Content */}
      {!dataLoading && dashboardData && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* KPI Cards */}
          <SlideInAnimation direction="up" delay={0}>
            <DataLoadingCard
              title="Total Leads"
              isLoading={dataLoading}
              className="col-span-1"
            >
              <div className="space-y-2">
                <p className="text-3xl font-bold">{dashboardData.totalLeads || 0}</p>
                <p className="text-xs text-muted-foreground">
                  +{dashboardData.leadsThisMonth || 0} this month
                </p>
              </div>
            </DataLoadingCard>
          </SlideInAnimation>

          <SlideInAnimation direction="up" delay={1}>
            <DataLoadingCard
              title="Conversion Rate"
              isLoading={dataLoading}
              className="col-span-1"
            >
              <div className="space-y-2">
                <p className="text-3xl font-bold">
                  {dashboardData.conversionRate?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Target: 25%
                </p>
              </div>
            </DataLoadingCard>
          </SlideInAnimation>

          <SlideInAnimation direction="up" delay={2}>
            <DataLoadingCard
              title="Avg Response Time"
              isLoading={dataLoading}
              className="col-span-1"
            >
              <div className="space-y-2">
                <div className="text-3xl font-bold">
                  {dashboardData?.conversionRate ? Math.round(dashboardData.conversionRate) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Target: 2 hours
                </p>
              </div>
            </DataLoadingCard>
          </SlideInAnimation>

          <SlideInAnimation direction="up" delay={3}>
            <DataLoadingCard
              title="Bookings"
              isLoading={dataLoading}
              className="col-span-1"
            >
              <div className="space-y-2">
                <p className="text-3xl font-bold">{dashboardData?.totalLeads || 0}</p>
                <p className="text-xs text-muted-foreground">
                  +{dashboardData?.leadsThisMonth || 0} this month
                </p>
              </div>
            </DataLoadingCard>
          </SlideInAnimation>
        </div>
      )}

      {/* Recent Activity */}
      {!dataLoading && dashboardData && (
        <SlideInAnimation direction="up" delay={4}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest leads and interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData && Array.isArray(dashboardData) ? (
                <div className="space-y-4">
                  {(dashboardData as any[]).slice(0, 5).map((activity: any, index: number) => (
                    <FadeInAnimation key={index} delay={index * 50}>
                      <div className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.timestamp}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {activity.type}
                        </span>
                      </div>
                    </FadeInAnimation>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Recent Activity"
                  description="Your recent activity will appear here"
                />
              )}
            </CardContent>
          </Card>
        </SlideInAnimation>
      )}

      {/* Empty State */}
      {!dataLoading && !dashboardData && (
        <EmptyState
          title="No Data Available"
          description="Start by creating your first lead or importing data"
          action={
            <Button onClick={handleRefresh}>
              Try Again
            </Button>
          }
        />
      )}
    </div>
  );
};

export default EnhancedDashboard;
