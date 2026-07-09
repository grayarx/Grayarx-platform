# TypeScript Errors Fix Guide

## Current Status
- **Total Errors**: 546 TypeScript errors
- **Root Cause**: Schema mismatches between database schema and router implementations
- **Priority**: Fix high-impact routers first

## Error Distribution by File

| File | Error Count | Priority | Issue |
|------|------------|----------|-------|
| leadManagementRouter.ts | 32 | HIGH | Missing `dealershipId`, `assignedTo` fields in leads table |
| salesPerformanceRouter.ts | 29 | HIGH | Schema mismatch for sales metrics |
| complianceServices.ts | 28 | MEDIUM | Type mismatches in compliance data |
| vehiclePhotoUploadService.ts | 20 | MEDIUM | Photo upload schema issues |
| analyticsRouter.ts | 19 | MEDIUM | Analytics data structure mismatch |
| smsCampaignService.ts | 17 | LOW | SMS service type issues |
| emailVerification.ts | 17 | LOW | Email verification schema |
| emailSegmentationService.ts | 17 | LOW | Segmentation logic type issues |
| webhookIntegrationService.ts | 15 | LOW | Webhook payload types |
| testDriveRouter.ts | 14 | HIGH | Missing appointment fields |

## High-Priority Fixes (80% of errors)

### 1. Lead Management Router (32 errors)
**Issue**: `leads` table missing fields used by router
- Missing: `dealershipId`, `assignedTo`, `qualityScore`
- **Fix**: Either update schema OR update router to use available fields

**Schema Update Option**:
```sql
ALTER TABLE leads ADD COLUMN dealershipId INT;
ALTER TABLE leads ADD COLUMN assignedTo INT;
ALTER TABLE leads ADD COLUMN qualityScore DECIMAL(3,2);
```

### 2. Sales Performance Router (29 errors)
**Issue**: Sales metrics schema mismatch
- **Fix**: Align router with actual database structure

### 3. Compliance Services (28 errors)
**Issue**: Type mismatches in compliance tracking
- **Fix**: Update type definitions to match schema

### 4. Test Drive Router (14 errors)
**Issue**: Missing `appointmentTime` field in testDrives table
- **Fix**: Add missing field or update router

## Client-Side Errors (70+ errors)
Most client errors are due to missing tRPC procedure definitions:
- `trpc.system.getDashboardStats` - needs implementation
- `trpc.insights.getLeadsTrend` - needs implementation
- `trpc.system.getRecentActivity` - needs implementation
- `trpc.collaboration` - not defined
- `trpc.vehicle` - not defined

## Recommended Fix Strategy

### Phase 1: Quick Wins (1-2 hours)
1. Add missing schema fields to high-impact tables
2. Generate and apply migrations
3. Fix type definitions in services

### Phase 2: Router Alignment (2-3 hours)
1. Update routers to match schema
2. Implement missing tRPC procedures
3. Fix client-side hooks

### Phase 3: Client Fixes (1-2 hours)
1. Fix component type errors
2. Add missing tRPC procedures
3. Update hooks to match new API

## Quick Fix Commands

```bash
# Generate new migration after schema changes
pnpm drizzle-kit generate

# Apply migration
# (Use webdev_execute_sql tool)

# Check specific file errors
pnpm tsc --noEmit 2>&1 | grep "leadManagementRouter"

# Count errors by file
pnpm tsc --noEmit 2>&1 | grep "error TS" | sed 's/(.*//' | sort | uniq -c | sort -rn
```

## Files Needing Attention

### Must Fix (Blocking deployment):
1. `server/routers/leadManagementRouter.ts` - 32 errors
2. `server/routers/salesPerformanceRouter.ts` - 29 errors
3. `server/routers/testDriveRouter.ts` - 14 errors

### Should Fix (Important features):
4. `server/_core/complianceServices.ts` - 28 errors
5. `server/routers/analyticsRouter.ts` - 19 errors

### Can Defer (Nice to have):
6. SMS/Email services - 34 errors combined
7. Webhook services - 15 errors

## Next Steps

1. **Immediate**: Update database schema with missing fields
2. **Short-term**: Fix high-priority routers
3. **Medium-term**: Implement missing tRPC procedures
4. **Long-term**: Add comprehensive type safety across all services

## Testing After Fixes

```bash
# Run type check
pnpm tsc --noEmit

# Run tests
pnpm test

# Check dev server
pnpm dev
```

## Notes

- The admin dashboards (AdminDashboard.tsx and AdminDashboardEnhanced.tsx) are ready to use once the tRPC procedures are implemented
- Most errors are fixable by aligning schema with router expectations
- Client-side errors will resolve once server procedures are properly typed
