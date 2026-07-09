# Interactive Upgrade Modal Guide

## Overview

The Interactive Upgrade Modal is a comprehensive component that appears when users attempt to access features locked behind their current subscription tier. It provides a smooth, informative upgrade experience with pricing comparison, feature details, and seamless tier selection.

## Features

### 1. **Automatic Feature Detection**
- Detects when a user tries to access a locked feature
- Automatically identifies the required tier for that feature
- Displays clear messaging about why the feature is locked

### 2. **Pricing Tiers Display**
- Shows all 3 pricing tiers (Starter, Professional, Enterprise)
- Displays monthly pricing in ZAR (R)
- Highlights current tier with green badge
- Highlights required tier for the feature with blue badge
- Shows feature count for each tier

### 3. **Interactive Tier Selection**
- Users can click to select a higher tier
- Prevents selection of lower tiers
- Prevents selection of current tier
- Visual feedback for selected tier (purple ring)
- "Selected" button state changes dynamically

### 4. **Feature Comparison Table**
- Toggle-able detailed feature comparison
- Shows which features are available in each tier
- Uses checkmarks (✓) and X icons for clarity
- Includes 10+ key features across all tiers
- Responsive table with horizontal scroll on mobile

### 5. **Feature Highlighting**
- Shows the locked feature prominently at the top
- Displays feature name, description, and required tier
- Highlights the feature in the tier card that unlocks it
- Clear visual connection between feature and tier

### 6. **Upgrade Action**
- "Upgrade Now" button with arrow icon
- Disabled until valid tier is selected
- Shows loading state during upgrade process
- Handles upgrade via tRPC mutation
- Automatically refreshes page after successful upgrade
- Shows error messages on failure

### 7. **Responsive Design**
- 3-column layout on desktop
- Stacked layout on mobile
- Scrollable comparison table on small screens
- Modal adjusts size based on content

## Usage

### Basic Usage with FeatureGate

```tsx
import { FeatureGate } from "@/components/FeatureGate";

export function MyComponent() {
  return (
    <FeatureGate
      featureId="api_access"
      featureName="API Access"
      featureDescription="Full REST API access for custom integrations"
      requiredTier="enterprise"
    >
      <div>Your API access content here</div>
    </FeatureGate>
  );
}
```

### Using FeatureLockedButton

```tsx
import { FeatureLockedButton } from "@/components/FeatureGate";

export function MyComponent() {
  return (
    <FeatureLockedButton
      featureId="advanced_analytics"
      featureName="Advanced Analytics"
      requiredTier="professional"
      onClick={() => console.log("Clicked")}
    >
      View Analytics
    </FeatureLockedButton>
  );
}
```

### Using FeatureLockedPrompt

```tsx
import { FeatureLockedPrompt } from "@/components/FeatureGate";

export function MyComponent() {
  return (
    <div>
      <FeatureLockedPrompt
        featureId="webhook_support"
        featureName="Webhook Support"
        requiredTier="professional"
      />
    </div>
  );
}
```

### Programmatic Modal Trigger

```tsx
import { useUpgradeModal } from "@/contexts/UpgradeModalContext";

export function MyComponent() {
  const { openUpgradeModal } = useUpgradeModal();

  return (
    <button
      onClick={() =>
        openUpgradeModal({
          id: "custom_integration",
          name: "Custom Integration",
          description: "Connect with your favorite CRM",
          requiredTier: "enterprise",
        })
      }
    >
      Try Custom Integration
    </button>
  );
}
```

## Setup

### 1. Add Provider to App

```tsx
import { UpgradeModalProvider } from "@/contexts/UpgradeModalContext";

export function App() {
  return (
    <UpgradeModalProvider>
      {/* Your app content */}
    </UpgradeModalProvider>
  );
}
```

### 2. Ensure Feature Access Hook is Available

The modal uses `useFeatureAccess` hook which should be configured with your feature definitions. See `FEATURE_ACCESS_CONTROL_GUIDE.md` for details.

## Component Props

### UpgradeModal

```tsx
interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: "starter" | "professional" | "enterprise" | null;
  lockedFeature: {
    id: string;
    name: string;
    description: string;
    requiredTier: "starter" | "professional" | "enterprise";
  };
  onUpgrade: (tier: "starter" | "professional" | "enterprise") => Promise<void>;
}
```

### FeatureGate

```tsx
interface FeatureGateProps {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeButton?: boolean;
  featureName?: string;
  featureDescription?: string;
  requiredTier?: "starter" | "professional" | "enterprise";
}
```

## Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| Starter | R 3,999/mo | Basic features, email support |
| Professional | R 7,999/mo | Advanced analytics, webhooks, priority support |
| Enterprise | R 11,999/mo | Full API access, custom integrations, phone support |

## Feature Mapping

Features are mapped to tiers in the system. When a user tries to access a feature they don't have access to, the modal automatically determines the required tier and displays it.

### Example Feature Mappings

- `api_access` → Enterprise only
- `webhook_support` → Professional+
- `advanced_analytics` → Professional+
- `lead_prioritization` → Professional+
- `inventory_sync` → Professional+
- `custom_integration` → Enterprise only

## Upgrade Flow

1. User clicks on locked feature or button
2. System checks if user has access
3. If no access, modal opens automatically
4. Modal displays:
   - Current tier (highlighted in green)
   - Required tier for feature (highlighted in blue)
   - All available tiers
   - Feature comparison (optional)
5. User selects desired tier
6. User clicks "Upgrade Now"
7. System processes upgrade via tRPC
8. Page refreshes with new tier active
9. User now has access to feature

## Customization

### Custom Feature Descriptions

```tsx
<FeatureGate
  featureId="api_access"
  featureName="REST API"
  featureDescription="Build custom integrations with our REST API. Perfect for connecting with your existing systems."
  requiredTier="enterprise"
>
  {/* Content */}
</FeatureGate>
```

### Custom Fallback UI

```tsx
<FeatureGate
  featureId="advanced_analytics"
  fallback={
    <div className="p-4 bg-blue-50 rounded">
      <p>Advanced Analytics is available in Professional and Enterprise plans</p>
      <button>Learn more</button>
    </div>
  }
>
  {/* Content */}
</FeatureGate>
```

## Error Handling

The modal handles several error scenarios:

1. **Network Error**: Shows error message and allows retry
2. **Invalid Tier Selection**: Disables invalid options
3. **Upgrade Failure**: Displays error and allows user to try again
4. **Missing Data**: Shows graceful fallback UI

## Accessibility

- Full keyboard navigation support
- ARIA labels on all interactive elements
- Screen reader announcements for modal
- High contrast colors for visibility
- Focus management for modal open/close

## Performance

- Modal is lazy-loaded only when needed
- Tier selection state is local (no API calls during selection)
- Upgrade action is debounced to prevent double-clicks
- Feature comparison table is optimized for rendering

## Testing

The modal includes comprehensive test coverage:

```bash
pnpm test -- UpgradeModal
```

Tests cover:
- Modal display and visibility
- Tier selection logic
- Upgrade action handling
- Error scenarios
- Accessibility compliance
- Responsive behavior

## Troubleshooting

### Modal Not Appearing

1. Ensure `UpgradeModalProvider` is in your app root
2. Check that `useFeatureAccess` hook is properly configured
3. Verify feature ID is correctly mapped in feature definitions

### Upgrade Not Working

1. Check that dealership ID is stored in localStorage
2. Verify tRPC endpoint `featureAccess.updateSubscriptionTier` exists
3. Check browser console for error messages
4. Ensure user has permission to upgrade

### Styling Issues

1. Verify Tailwind CSS is properly configured
2. Check that shadcn/ui components are installed
3. Ensure custom animations are loaded

## Best Practices

1. **Always provide feature names** - Makes modal more user-friendly
2. **Use descriptive feature descriptions** - Helps users understand value
3. **Test upgrade flow** - Ensure payment integration works
4. **Monitor upgrade analytics** - Track which features users try to upgrade for
5. **Keep tier descriptions updated** - Reflect actual feature availability

## Integration with Billing

The upgrade modal integrates with your billing system via:

1. **Stripe Integration** - For credit card payments
2. **Manual Invoicing** - For bank transfer payments
3. **Subscription Management** - tRPC endpoints handle tier changes

When user upgrades:
- New subscription is created in database
- Stripe charge is processed (if applicable)
- Invoice is generated (if applicable)
- User is granted immediate access to new tier features
- Old subscription is marked as superseded

## Future Enhancements

Potential improvements:

1. **Promo Codes** - Apply discount codes during upgrade
2. **Trial Extensions** - Offer trial period for new tier
3. **Annual Billing** - Show annual pricing option
4. **Feature Requests** - Let users request specific features
5. **Usage Analytics** - Show how much user is using current tier
6. **Downgrade Option** - Allow users to downgrade tiers
