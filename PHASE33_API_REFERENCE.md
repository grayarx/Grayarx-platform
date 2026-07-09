# Phase 33 API Reference

**Version:** 1.0  
**Last Updated:** June 1, 2026  
**Status:** Production Ready  

---

## Overview

Phase 33 introduces 5 critical features accessible through tRPC endpoints. All endpoints require authentication (Manus OAuth) except where noted.

---

## 1. Email Notification System

### Endpoints

#### `notifications.getPreferences`
**Type:** Query (GET)  
**Authentication:** Required  
**Description:** Retrieve dealership notification preferences

**Request:**
```typescript
// No input required
```

**Response:**
```typescript
{
  dealershipId: number;
  newLeadEnabled: number; // 0 or 1
  leadStatusChangeEnabled: number;
  bookingRequestEnabled: number;
  preapprovalSubmissionEnabled: number;
  notificationFrequency: "immediate" | "daily_digest" | "weekly_digest";
  quietHoursStart?: string; // "HH:MM" format
  quietHoursEnd?: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Example:**
```typescript
const prefs = await trpc.notifications.getPreferences.useQuery();
```

---

#### `notifications.updatePreferences`
**Type:** Mutation (POST)  
**Authentication:** Required  
**Description:** Update dealership notification preferences

**Request:**
```typescript
{
  newLeadEnabled?: number; // 0 or 1
  leadStatusChangeEnabled?: number;
  bookingRequestEnabled?: number;
  preapprovalSubmissionEnabled?: number;
  notificationFrequency?: "immediate" | "daily_digest" | "weekly_digest";
  quietHoursStart?: string; // "HH:MM" format
  quietHoursEnd?: string;
  timezone?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  updatedPreferences: NotificationPreferences;
}
```

**Example:**
```typescript
const result = await trpc.notifications.updatePreferences.useMutation({
  newLeadEnabled: 1,
  quietHoursStart: "18:00",
  quietHoursEnd: "08:00",
  timezone: "Africa/Johannesburg"
});
```

---

#### `notifications.getHistory`
**Type:** Query (GET)  
**Authentication:** Required  
**Description:** Retrieve notification history for dealership

**Request:**
```typescript
{
  limit?: number; // 1-100, default: 50
}
```

**Response:**
```typescript
[
  {
    id: number;
    dealershipId: number;
    type: "new_lead" | "lead_status_change" | "booking_request" | "preapproval_submission";
    recipient: string;
    subject: string;
    body: string;
    status: "sent" | "failed" | "bounced";
    sentAt: Date;
    openedAt?: Date;
    clickedAt?: Date;
    bounceAt?: Date;
  }
]
```

**Example:**
```typescript
const history = await trpc.notifications.getHistory.useQuery({ limit: 20 });
```

---

## 2. Advanced Audit Logging

### Endpoints

#### `auditLog.getHistory`
**Type:** Query (GET)  
**Authentication:** Required  
**Description:** Retrieve dealership audit logs with filtering

**Request:**
```typescript
{
  userId?: number;
  action?: string;
  resourceType?: string;
  limit?: number; // 1-100, default: 50
}
```

**Response:**
```typescript
[
  {
    id: number;
    dealershipId: number;
    userId: number;
    action: string;
    resourceType: string;
    resourceId: number;
    oldValue?: string;
    newValue?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
  }
]
```

**Example:**
```typescript
const logs = await trpc.auditLog.getHistory.useQuery({
  action: "lead_status_updated",
  limit: 50
});
```

---

#### `auditLog.getStatistics`
**Type:** Query (GET)  
**Authentication:** Required  
**Description:** Get audit log statistics for date range

**Request:**
```typescript
{
  days?: number; // 1-365, default: 30
}
```

**Response:**
```typescript
{
  dealershipId: number;
  period: {
    startDate: Date;
    endDate: Date;
    days: number;
  };
  totalLogs: number;
  actionBreakdown: {
    [action: string]: number;
  };
  resourceTypeBreakdown: {
    [resourceType: string]: number;
  };
  userActivity: {
    [userId: number]: number;
  };
}
```

**Example:**
```typescript
const stats = await trpc.auditLog.getStatistics.useQuery({ days: 30 });
```

---

#### `auditLog.exportCSV`
**Type:** Query (GET)  
**Authentication:** Required  
**Description:** Export audit logs to CSV format

**Request:**
```typescript
{
  days?: number; // 1-365, default: 30
}
```

**Response:**
```typescript
{
  csvData: string; // CSV formatted data
  fileName: string;
  rowCount: number;
  generatedAt: Date;
}
```

**Example:**
```typescript
const export = await trpc.auditLog.exportCSV.useQuery({ days: 30 });
// Download CSV file
```

---

## 3. Lead Quality Scoring

### Endpoints

#### `leadQuality.calculateScore`
**Type:** Mutation (POST)  
**Authentication:** Required  
**Description:** Calculate quality score for a lead

**Request:**
```typescript
{
  leadId: number;
}
```

**Response:**
```typescript
{
  leadId: number;
  overallScore: number; // 0-100
  sourceScore: number; // 0-1
  languageScore: number;
  responseTimeScore: number;
  engagementScore: number;
  vehicleTypeScore: number;
  priceRangeScore: number;
  locationScore: number;
  urgencyScore: number;
  contactQualityScore: number;
  historyScore: number;
  calculatedAt: Date;
} | null
```

**Example:**
```typescript
const score = await trpc.leadQuality.calculateScore.useMutation({
  leadId: 123
});
```

---

#### `leadQuality.getInsights`
**Type:** Query (GET)  
**Authentication:** Required  
**Description:** Get quality insights and recommendations for a lead

**Request:**
```typescript
{
  leadId: number;
}
```

**Response:**
```typescript
{
  leadId: number;
  overallScore: number; // 0-100
  quality: "High" | "Medium" | "Low";
  topStrengths: [
    {
      factor: string;
      score: number;
      description: string;
    }
  ];
  topWeaknesses: [
    {
      factor: string;
      score: number;
      description: string;
    }
  ];
  recommendations: string[];
  confidenceLevel: "high" | "medium" | "low";
} | null
```

**Example:**
```typescript
const insights = await trpc.leadQuality.getInsights.useQuery({ leadId: 123 });
```

---

## 4. Performance Analytics

### Endpoints

#### `performance.calculateDaily`
**Type:** Mutation (POST)  
**Authentication:** Required  
**Description:** Calculate daily performance metrics

**Request:**
```typescript
{
  date?: Date; // default: today
}
```

**Response:**
```typescript
{
  dealershipId: number;
  date: Date;
  leadVolume: number;
  leadConversionRate: number; // 0-100
  bookingRate: number;
  avgLeadQuality: number; // 0-1
  avgResponseTime: number; // minutes
  roiEstimate: number; // currency
  costPerLead: number;
  calculatedAt: Date;
} | null
```

**Example:**
```typescript
const metrics = await trpc.performance.calculateDaily.useMutation({
  date: new Date()
});
```

---

#### `performance.getMetrics`
**Type:** Query (GET)  
**Authentication:** Required  
**Description:** Get performance metrics for date range

**Request:**
```typescript
{
  startDate: Date;
  endDate: Date;
}
```

**Response:**
```typescript
[
  {
    dealershipId: number;
    date: Date;
    leadVolume: number;
    leadConversionRate: number;
    bookingRate: number;
    avgLeadQuality: number;
    avgResponseTime: number;
    roiEstimate: number;
    costPerLead: number;
  }
]
```

**Example:**
```typescript
const metrics = await trpc.performance.getMetrics.useQuery({
  startDate: new Date(Date.now() - 30*24*60*60*1000),
  endDate: new Date()
});
```

---

#### `performance.getSummary`
**Type:** Query (GET)  
**Authentication:** Required  
**Description:** Get performance summary for dealership

**Request:**
```typescript
{
  days?: number; // 1-365, default: 30
}
```

**Response:**
```typescript
{
  dealershipId: number;
  period: {
    startDate: Date;
    endDate: Date;
    days: number;
  };
  totalLeads: number;
  avgConversionRate: number;
  avgBookingRate: number;
  avgLeadQuality: number;
  totalRoiEstimate: number;
  avgCostPerLead: number;
  trend: "improving" | "stable" | "declining";
} | null
```

**Example:**
```typescript
const summary = await trpc.performance.getSummary.useQuery({ days: 30 });
```

---

## 5. Bulk Lead Import

### Endpoints

#### `leadImport.importCSV`
**Type:** Mutation (POST)  
**Authentication:** Required  
**Description:** Import leads from CSV data

**Request:**
```typescript
{
  fileName: string; // max 255 chars
  csvData: string; // CSV content, max 1MB
}
```

**CSV Format:**
```
contact_name,email,phone,notes
John Doe,john@example.com,+27123456789,Test lead
Jane Smith,jane@example.com,+27987654321,Another test
```

**Response:**
```typescript
{
  importId: number;
  fileName: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  status: "completed" | "processing" | "failed";
  errors: [
    {
      rowNumber: number;
      errorMessage: string;
      data: Record<string, any>;
    }
  ];
  importedAt: Date;
} | null
```

**Example:**
```typescript
const result = await trpc.leadImport.importCSV.useMutation({
  fileName: "leads_batch_1.csv",
  csvData: csvContent
});
```

---

#### `leadImport.getHistory`
**Type:** Query (GET)  
**Authentication:** Required  
**Description:** Get import history for dealership

**Request:**
```typescript
{
  limit?: number; // 1-100, default: 50
}
```

**Response:**
```typescript
[
  {
    id: number;
    dealershipId: number;
    fileName: string;
    totalRows: number;
    successCount: number;
    errorCount: number;
    status: "completed" | "processing" | "failed";
    importedAt: Date;
  }
]
```

**Example:**
```typescript
const history = await trpc.leadImport.getHistory.useQuery({ limit: 20 });
```

---

#### `leadImport.getDetails`
**Type:** Query (GET)  
**Authentication:** Required  
**Description:** Get detailed information about a specific import

**Request:**
```typescript
{
  importId: number;
}
```

**Response:**
```typescript
{
  id: number;
  dealershipId: number;
  fileName: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  status: "completed" | "processing" | "failed";
  errors: [
    {
      rowNumber: number;
      errorMessage: string;
      data: Record<string, any>;
    }
  ];
  importedAt: Date;
}
```

**Example:**
```typescript
const details = await trpc.leadImport.getDetails.useQuery({ importId: 123 });
```

---

#### `leadImport.retryFailed`
**Type:** Mutation (POST)  
**Authentication:** Required  
**Description:** Retry failed rows from a previous import

**Request:**
```typescript
{
  importId: number;
}
```

**Response:**
```typescript
{
  importId: number;
  retryCount: number;
  successCount: number;
  errorCount: number;
  status: "completed" | "processing" | "failed";
  errors: [
    {
      rowNumber: number;
      errorMessage: string;
      data: Record<string, any>;
    }
  ];
  retriedAt: Date;
}
```

**Example:**
```typescript
const retry = await trpc.leadImport.retryFailed.useMutation({
  importId: 123
});
```

---

## Error Handling

### Common Error Responses

**Authentication Error (401)**
```typescript
{
  code: "UNAUTHORIZED",
  message: "Authentication required"
}
```

**Permission Error (403)**
```typescript
{
  code: "FORBIDDEN",
  message: "Insufficient permissions"
}
```

**Validation Error (400)**
```typescript
{
  code: "BAD_REQUEST",
  message: "Invalid input",
  details: {
    field: "error message"
  }
}
```

**Not Found Error (404)**
```typescript
{
  code: "NOT_FOUND",
  message: "Resource not found"
}
```

**Server Error (500)**
```typescript
{
  code: "INTERNAL_SERVER_ERROR",
  message: "An unexpected error occurred"
}
```

---

## Rate Limiting

**Rate Limits:**
- Queries: 100 requests/minute per dealership
- Mutations: 50 requests/minute per dealership
- Bulk imports: 10 concurrent imports max

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Best Practices

1. **Cache Results:** Cache notification preferences and audit statistics to reduce API calls
2. **Batch Operations:** Use bulk import for multiple leads instead of individual API calls
3. **Error Handling:** Always handle error responses and implement retry logic
4. **Monitoring:** Monitor API response times and error rates
5. **Security:** Never expose API keys in client-side code
6. **Pagination:** Use limit parameter for large result sets
7. **Timestamps:** Always store timestamps in UTC

---

## Testing

**Test Endpoints:**
- All endpoints can be tested in development environment
- Use test data with IDs 1-100 for safe testing
- Audit logs for test data are automatically cleaned up daily

**Example Test:**
```typescript
// Test email notifications
const prefs = await trpc.notifications.getPreferences.useQuery();
expect(prefs.dealershipId).toBeDefined();

// Test lead quality scoring
const score = await trpc.leadQuality.calculateScore.useMutation({ leadId: 1 });
expect(score?.overallScore).toBeGreaterThanOrEqual(0);
expect(score?.overallScore).toBeLessThanOrEqual(100);
```

---

**Document Version:** 1.0  
**Last Updated:** June 1, 2026  
**Status:** READY FOR PRODUCTION ✅
