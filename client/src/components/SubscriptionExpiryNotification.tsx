import React, { useEffect } from "react";
import { useSubscriptionDetails, useSubscriptionExpiringoon } from "../hooks/useFeatureAccess";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

/**
 * Component to show subscription expiry notifications
 * Displays warnings when subscription is expiring soon or has expired
 */
export function SubscriptionExpiryNotification() {
  const { subscription, isLoading } = useSubscriptionDetails();
  const { isExpiringoon } = useSubscriptionExpiringoon();

  if (isLoading || !subscription) return null;

  // Subscription expired
  if (subscription.isExpired) {
    return (
      <Card className="p-4 bg-red-50 border-red-200 mb-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Subscription Expired</h3>
            <p className="text-sm text-red-800 mt-1">
              Your subscription expired on {new Date(subscription.renewalDate).toLocaleDateString()}. Please renew to continue using GrayArx.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => (window.location.href = "/billing")}
              >
                Renew Subscription
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300"
                onClick={() => (window.location.href = "/support")}
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Subscription expiring soon
  if (isExpiringoon) {
    return (
      <Card className="p-4 bg-amber-50 border-amber-200 mb-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900">Subscription Expiring Soon</h3>
            <p className="text-sm text-amber-800 mt-1">
              Your {subscription.tier} subscription renews in{" "}
              <span className="font-semibold">{subscription.daysUntilRenewal} days</span> on{" "}
              {new Date(subscription.renewalDate).toLocaleDateString()}.
            </p>
            <p className="text-xs text-amber-700 mt-2">
              Monthly cost: <span className="font-medium">R {subscription.monthlyPrice}</span>
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="border-amber-300 text-amber-900 hover:bg-amber-100"
                onClick={() => (window.location.href = "/billing")}
              >
                View Billing
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-300 text-amber-900 hover:bg-amber-100"
                onClick={() => (window.location.href = "/upgrade")}
              >
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Subscription active
  return (
    <Card className="p-4 bg-green-50 border-green-200 mb-4">
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-green-900">Subscription Active</h3>
          <p className="text-sm text-green-800 mt-1">
            Your {subscription.tier} subscription is active. Renews in{" "}
            <span className="font-semibold">{subscription.daysUntilRenewal} days</span>.
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Hook to show browser notification when subscription is expiring
 */
export function useSubscriptionExpiryAlert() {
  const { subscription } = useSubscriptionDetails();
  const { isExpiringoon } = useSubscriptionExpiringoon();

  useEffect(() => {
    if (isExpiringoon && subscription && "Notification" in window) {
      // Request permission if not already granted
      if (Notification.permission === "granted") {
        new Notification("Subscription Expiring Soon", {
          body: `Your subscription renews in ${subscription.daysUntilRenewal} days.`,
          icon: "/favicon.ico",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("Subscription Expiring Soon", {
              body: `Your subscription renews in ${subscription.daysUntilRenewal} days.`,
              icon: "/favicon.ico",
            });
          }
        });
      }
    }
  }, [isExpiringoon, subscription]);
}
