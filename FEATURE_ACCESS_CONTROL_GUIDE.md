# Feature Access Control System

## Overview

The Feature Access Control System enforces subscription tier limits and prevents unauthorized feature access. It ensures that dealerships can only use features included in their subscription plan.

## Architecture

### Three-Tier Pricing Model

- **Starter (R 3,999/month)** — Basic features, email support
- **Professional (R 7,999/month)** — Advanced features, priority support, integrations
- **Enterprise (R 11,999/month)** — All features, API access, dedicated support

### Feature Categories

1. **API** — Direct API access (Enterprise only)
2. **Integration** — Third-party integrations (Professional+)
3. **Analytics** — Advanced reporting and insights (Professional+)
4. **Support** — Support tier levels (varies by plan)
5. **Communication** — Messaging features (all tiers)

## Feature Definitions

### Starter Features
- WhatsApp chatbot
- Email notifications
- Basic lead capture
- Dashboard

### Professional Features (Starter +)
- Advanced analytics & reporting
- Lead prioritization AI
- Inventory sync
- Webhook support
- Priority email support (12-24h)

### Enterprise Features (Professional +)
- Full API access
- Custom webhooks
- CRM integration support
- Phone support
- Dedicated account manager

## Implementation

### Backend: Feature Access Checking

```typescript
import { checkFeatureAccess } from "./server/featureAccessControl";

// Check if dealership has access to a feature
const { hasAccess, tier, reason } = await checkFeatureAccess(dealershipId, "api_access");

if (!hasAccess) {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: `Feature access denied: ${reason}`,
  });
}
```

### Backend: Middleware Protection

```typescript
import { requireFeature, requireTier } from "./server/_core/featureAccessMiddleware";

// Protect procedure with feature requirement
export const myProcedure = protectedProcedure
  .use(requireFeature("api_access"))
  .mutation(async ({ input, ctx }) => {
    // Only Enterprise tier can reach here
  });

// Or protect with tier requirement
export const myProcedure = protectedProcedure
  .use(requireTier("professional"))
  .mutation(async ({ input, ctx }) => {
    // Professional tier and above can reach here
  });
```

### Frontend: Feature Gating

```typescript
import { FeatureGate, useFeatureAccess } from "@/components/FeatureGate";

// Gate entire component
<FeatureGate featureId="api_access">
  <APIAccessPanel />
</FeatureGate>

// Or use hook for conditional rendering
function MyComponent() {
  const { hasAccess, tier } = useFeatureAccess("advanced_analytics");
  
  if (!hasAccess) {
    return <UpgradePrompt />;
  }
  
  return <AnalyticsPanel />;
}
```

### Frontend: Subscription Monitoring

```typescript
import { SubscriptionExpiryNotification } from "@/components/SubscriptionExpiryNotification";

// Show expiry notifications
function Dashboard() {
  return (
    <>
      <SubscriptionExpiryNotification />
      {/* Rest of dashboard */}
    </>
  );
}
```

## API Endpoints

### Dealership Endpoints

- `featureAccess.checkFeatureAccess` — Check access to specific feature
- `featureAccess.getAccessibleFeatures` — Get all accessible features
- `featureAccess.getSubscriptionDetails` — Get subscription info
- `featureAccess.isSubscriptionExpiringoon` — Check expiry status
- `featureAccess.getFeatureDefinitions` — Get all feature definitions

### Admin Endpoints

- `featureAccess.getAllSubscriptions` — Get all dealership subscriptions
- `featureAccess.updateSubscriptionTier` — Change dealership tier
- `featureAccess.suspendSubscription` — Pause subscription
- `featureAccess.cancelSubscription` — Cancel subscription
- `featureAccess.extendSubscription` — Extend renewal date
- `featureAccess.getSubscriptionStats` — Get MRR and statistics

## Subscription Lifecycle

### Active Subscription
- Dealership has access to all features in their tier
- Renewal date is in the future
- Status: `active`

### Expiring Soon (7 days)
- Browser notification sent
- UI shows warning banner
- Dealership can renew or upgrade

### Expired
- All features blocked
- Dealership cannot access platform
- Must renew to continue

### Suspended (Admin Action)
- Dealership loses access temporarily
- Can be reactivated by admin
- Status: `paused`

### Cancelled
- Subscription terminated
- Dealership loses all access
- Can create new subscription

## Usage Tracking

All feature access attempts are logged in `feature_access_logs` table:

```typescript
{
  dealership_id: number;
  user_id?: number;
  feature: string;
  action: "allowed" | "denied";
  reason?: string;
  metadata?: object;
  timestamp: Date;
}
```

## Admin Dashboard

Access `/admin/subscriptions` to:
- View all dealership subscriptions
- Change subscription tiers
- Suspend/cancel subscriptions
- Extend renewal dates
- View MRR and statistics

## Best Practices

### For Developers

1. **Always gate sensitive features** — Use `requireFeature()` or `requireTier()` middleware
2. **Provide clear error messages** — Tell users why they can't access a feature
3. **Show upgrade prompts** — Direct users to upgrade page when blocked
4. **Cache feature checks** — Use 5-minute cache to reduce database queries
5. **Log access attempts** — Track feature usage for analytics

### For Dealerships

1. **Monitor subscription status** — Check renewal date regularly
2. **Plan upgrades** — Upgrade before hitting feature limits
3. **Contact support** — Reach out if you need feature access

### For Admins

1. **Review MRR monthly** — Track revenue and churn
2. **Monitor suspensions** — Follow up with suspended dealerships
3. **Plan capacity** — Ensure infrastructure scales with tiers
4. **Audit access logs** — Review for suspicious activity

## Troubleshooting

### Feature access denied but user has right tier
- Clear browser cache (5-minute cache)
- Check subscription status in admin dashboard
- Verify feature definition includes tier

### Subscription not renewing
- Check `nextRenewalDate` in database
- Verify billing integration is working
- Contact billing support

### Expiry notifications not showing
- Check browser notification permissions
- Verify `useSubscriptionExpiryAlert()` is called
- Check browser console for errors

## Future Enhancements

- [ ] Usage-based billing (track API calls, leads, etc.)
- [ ] Feature trial periods
- [ ] Add-on features (à la carte)
- [ ] Custom tier creation
- [ ] Automatic tier downgrades on cancellation
- [ ] Feature analytics dashboard
