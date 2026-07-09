# Inventory Sync Setup Guide

## Overview
The GrayArx platform can automatically sync vehicle inventory from Cars.co.za and AutoTrader every night at 2 AM (UTC).

## How It Works
1. **Nightly Sync Job** - Runs automatically at 2 AM UTC
2. **Vehicle Scraping** - Fetches latest listings from Cars.co.za and AutoTrader
3. **Price Updates** - Updates market values for existing vehicles
4. **Deduplication** - Removes duplicate listings
5. **Database Sync** - Stores all data in GrayArx database

## Setup Instructions

### Step 1: Enable Scheduled Job
Run the following command to enable the nightly inventory sync:

```bash
manus-config schedule --enable inventory-sync
```

### Step 2: Verify Configuration
Check that the job is scheduled:

```bash
manus-config schedule --list
```

You should see:
```
✓ inventory-sync: Enabled (runs daily at 02:00 UTC)
```

### Step 3: Manual Sync (Optional)
To manually trigger a sync immediately:

```bash
curl -X POST https://your-domain.manus.space/api/trpc/inventorySync.manualSync \
  -H "Content-Type: application/json" \
  -d '{"dealershipId": "your-dealership-id"}'
```

## What Gets Synced

### From Cars.co.za
- Vehicle make, model, year
- Price
- Mileage
- Condition
- Location
- Contact details

### From AutoTrader
- Vehicle make, model, year
- Trade-in value
- Market value
- Condition assessment
- Featured listings

## Monitoring

### View Sync Logs
```bash
tail -f .manus-logs/inventory-sync.log
```

### Check Last Sync Time
```bash
curl https://your-domain.manus.space/api/trpc/inventorySync.getLastSyncTime
```

## Troubleshooting

### Sync Not Running
1. Check if schedule is enabled: `manus-config schedule --list`
2. Verify API credentials are set
3. Check logs: `tail -f .manus-logs/inventory-sync.log`

### Duplicate Vehicles
The system automatically deduplicates based on:
- VIN (if available)
- Make + Model + Year + Mileage

### Missing Vehicles
- Check if source websites are accessible
- Verify dealership location filters are correct
- Check API rate limits

## API Endpoints

### Get Sync Status
```
GET /api/trpc/inventorySync.getStatus
```

### Trigger Manual Sync
```
POST /api/trpc/inventorySync.manualSync
Body: { dealershipId: "string" }
```

### Get Sync History
```
GET /api/trpc/inventorySync.getSyncHistory
```

### Configure Sync Settings
```
POST /api/trpc/inventorySync.configureSettings
Body: {
  dealershipId: "string",
  autoSync: boolean,
  syncTime: "02:00", // UTC
  sources: ["cars.co.za", "autotrader"],
  maxResults: 500
}
```

## Performance Notes
- First sync may take 5-10 minutes (depends on vehicle count)
- Subsequent syncs typically take 2-3 minutes
- Synced data is cached for 24 hours
- Manual syncs bypass cache

## Support
For issues or questions, contact GrayArx support at support@grayarx.com
