# GrayArx Compliance Training & Audit System

## Overview

The Compliance Training & Audit System is a comprehensive solution for managing employee training, audit trails, and compliance communications within the GrayArx platform. It provides dealerships with tools to track compliance requirements, manage training modules, and maintain detailed audit logs for regulatory purposes.

## Architecture

The system is built on three core layers:

### 1. Backend Services (`server/_core/complianceTrainingServices.ts`)

Five specialized services handle all business logic:

#### Audit Trail Service
Logs and retrieves all compliance-related actions with advanced filtering capabilities.

**Key Methods:**
- `logAuditTrail()` - Record an action with metadata
- `getAuditTrail()` - Retrieve entries with filtering by entity type, date range, and ID

**Example Usage:**
```typescript
await logAuditTrail(
  dealershipId,
  userId,
  "create",
  "template",
  templateId,
  "Created new POPIA verification template",
  { templateName: "POPIA Verification" }
);
```

#### Communication Template Service
Manages email and SMS templates with approval workflow.

**Key Methods:**
- `createTemplate()` - Create a new template
- `getTemplates()` - List templates with optional category filter
- `updateTemplate()` - Modify template content
- `approveTemplate()` - Mark template as approved

**Example Usage:**
```typescript
const template = await createTemplate(
  dealershipId,
  "POPIA Verification Email",
  "email",
  "Dear {{firstName}}, please verify your email...",
  userId,
  "Email Verification",
  ["firstName", "verificationLink", "expiryDate"]
);
```

#### Training Module Service
Creates and manages training content modules.

**Key Methods:**
- `createTrainingModule()` - Create a new training module
- `getTrainingModules()` - List modules with optional topic filter
- `publishModule()` - Make module available to users
- `getModuleById()` - Retrieve specific module details

**Supported Topics:**
- `popia` - Protection of Personal Information Act
- `nrcs` - National Credit Regulator
- `sars` - South African Revenue Service
- `general` - General compliance

**Example Usage:**
```typescript
const module = await createTrainingModule(
  "POPIA Compliance Basics",
  "popia",
  "# POPIA Compliance\n\nContent here...",
  dealershipId,
  "Learn the basics of POPIA compliance",
  "https://example.com/video.mp4",
  30 // duration in minutes
);
```

#### Training Progress Service
Tracks user progress through training modules.

**Key Methods:**
- `startTraining()` - Initialize training for a user
- `updateProgress()` - Update completion percentage
- `completeTraining()` - Mark training as complete with score
- `getTrainingProgress()` - Retrieve user progress

**Example Usage:**
```typescript
// Start training
await startTraining(userId, moduleId);

// Update progress (50% complete)
await updateProgress(userId, moduleId, 50);

// Complete training with quiz score
await completeTraining(
  userId,
  moduleId,
  85, // quiz score
  "https://example.com/certificate.pdf"
);
```

#### Training Assignment Service
Assigns training to users with deadline tracking.

**Key Methods:**
- `assignTraining()` - Assign training to a user
- `getAssignments()` - List assignments with filters
- `completeAssignment()` - Mark assignment as complete
- `getOverdueAssignments()` - Get assignments past due date

**Example Usage:**
```typescript
const dueDate = new Date();
dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

await assignTraining(
  dealershipId,
  moduleId,
  assignedToUserId,
  assignedByUserId,
  dueDate
);
```

### 2. Automated Alerts (`server/_core/complianceTrainingAlerts.ts`)

Monitors training deadlines and sends automated notifications.

**Key Functions:**
- `checkOverdueTrainingAssignments()` - Detect overdue assignments
- `checkUpcomingTrainingDeadlines()` - Send reminders for upcoming deadlines
- `sendTrainingAlert()` - Send email notification
- `getActiveTrainingAlerts()` - Get all current alerts for a dealership
- `runPeriodicTrainingAlerts()` - Run scheduled checks (call from background job)

**Alert Severity Levels:**
- `low` - General information
- `medium` - Upcoming deadline (1-3 days)
- `high` - Due today or 3-7 days overdue
- `critical` - More than 7 days overdue

**Example Usage:**
```typescript
// Check for overdue assignments
const overdueAlerts = await checkOverdueTrainingAssignments(dealershipId);

// Check for upcoming deadlines
const upcomingAlerts = await checkUpcomingTrainingDeadlines(dealershipId);

// Get all active alerts
const allAlerts = await getActiveTrainingAlerts(dealershipId);
```

### 3. tRPC Routers

#### Compliance Training Router (`server/routers/complianceTrainingRouter.ts`)

Provides type-safe API endpoints for all training operations.

**Available Procedures:**

**Audit Trail:**
- `complianceTraining.auditTrail.get` - Query audit trail
- `complianceTraining.auditTrail.log` - Log an action

**Templates:**
- `complianceTraining.templates.list` - List templates
- `complianceTraining.templates.create` - Create new template
- `complianceTraining.templates.update` - Update template
- `complianceTraining.templates.approve` - Approve template

**Modules:**
- `complianceTraining.modules.list` - List training modules
- `complianceTraining.modules.create` - Create new module
- `complianceTraining.modules.publish` - Publish module

**Progress:**
- `complianceTraining.progress.get` - Get user progress
- `complianceTraining.progress.start` - Start training
- `complianceTraining.progress.update` - Update progress
- `complianceTraining.progress.complete` - Complete training

**Assignments:**
- `complianceTraining.assignments.list` - List assignments
- `complianceTraining.assignments.assign` - Assign training
- `complianceTraining.assignments.complete` - Complete assignment
- `complianceTraining.assignments.getOverdue` - Get overdue assignments

#### Compliance Training Alerts Router (`server/routers/complianceTrainingAlertsRouter.ts`)

Manages alert operations.

**Available Procedures:**
- `complianceTrainingAlerts.checkOverdue` - Check for overdue assignments
- `complianceTrainingAlerts.checkUpcoming` - Check for upcoming deadlines
- `complianceTrainingAlerts.getActive` - Get all active alerts
- `complianceTrainingAlerts.runPeriodic` - Run periodic checks (admin only)

## React Components

### ComplianceAuditTrail Component

**Location:** `client/src/pages/ComplianceAuditTrail.tsx`

**Features:**
- View audit trail entries with timestamps
- Filter by entity type (template, module, assignment, progress)
- Filter by date range
- Color-coded action badges (create, update, delete, approve)
- Display user information for each action

**Usage:**
```tsx
import ComplianceAuditTrail from "@/pages/ComplianceAuditTrail";

// In your router
<Route path="/admin/compliance/audit-trail" component={ComplianceAuditTrail} />
```

### CommunicationTemplateEditor Component

**Location:** `client/src/pages/CommunicationTemplateEditor.tsx`

**Features:**
- Create new templates with name, category, subject, and body
- Define template variables for personalization
- View all templates with status badges (draft, approved, rejected)
- Approve templates for use
- Filter templates by category (email, SMS, notification)

**Usage:**
```tsx
import CommunicationTemplateEditor from "@/pages/CommunicationTemplateEditor";

// In your router
<Route path="/admin/compliance/templates" component={CommunicationTemplateEditor} />
```

### TrainingModules Component

**Location:** `client/src/pages/TrainingModules.tsx`

**Features:**
- Create new training modules with video support
- View all modules with topic filtering
- Track user progress with visual progress bars
- Start training for users
- Publish modules to make them available
- Display module duration and description

**Usage:**
```tsx
import TrainingModules from "@/pages/TrainingModules";

// In your router
<Route path="/admin/compliance/training" component={TrainingModules} />
```

### TrainingAssignments Component

**Location:** `client/src/pages/TrainingAssignments.tsx`

**Features:**
- Assign training modules to users
- Set due dates for assignments
- Track assignment status (pending, in progress, completed)
- View overdue assignments with alert banner
- Mark assignments as complete
- Filter by status

**Usage:**
```tsx
import TrainingAssignments from "@/pages/TrainingAssignments";

// In your router
<Route path="/admin/compliance/assignments" component={TrainingAssignments} />
```

## Database Schema

### complianceAuditTrail
```sql
CREATE TABLE complianceAuditTrail (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dealershipId INT NOT NULL,
  userId INT,
  action VARCHAR(50) NOT NULL, -- create, update, delete, approve
  entityType VARCHAR(50) NOT NULL, -- template, module, assignment, progress
  entityId INT NOT NULL,
  description TEXT,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dealershipId) REFERENCES dealerships(id),
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX (dealershipId, createdAt),
  INDEX (entityType, entityId)
);
```

### communicationTemplates
```sql
CREATE TABLE communicationTemplates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dealershipId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- email, sms, notification
  subject VARCHAR(255),
  body LONGTEXT NOT NULL,
  variables JSON,
  status VARCHAR(50) DEFAULT 'draft', -- draft, approved, rejected
  createdBy INT,
  approvedBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approvedAt TIMESTAMP,
  FOREIGN KEY (dealershipId) REFERENCES dealerships(id),
  FOREIGN KEY (createdBy) REFERENCES users(id),
  FOREIGN KEY (approvedBy) REFERENCES users(id),
  INDEX (dealershipId, status)
);
```

### trainingModules
```sql
CREATE TABLE trainingModules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dealershipId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  topic VARCHAR(50) NOT NULL, -- popia, nrcs, sars, general
  content LONGTEXT NOT NULL,
  description TEXT,
  videoUrl VARCHAR(500),
  duration INT, -- minutes
  isPublished BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dealershipId) REFERENCES dealerships(id),
  INDEX (dealershipId, topic),
  INDEX (isPublished)
);
```

### trainingProgress
```sql
CREATE TABLE trainingProgress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  moduleId INT NOT NULL,
  status VARCHAR(50) DEFAULT 'started', -- started, in_progress, completed
  progressPercentage INT DEFAULT 0,
  quizScore INT,
  certificateUrl VARCHAR(500),
  startedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completedAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (moduleId) REFERENCES trainingModules(id),
  UNIQUE KEY (userId, moduleId),
  INDEX (status, completedAt)
);
```

### trainingAssignments
```sql
CREATE TABLE trainingAssignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dealershipId INT NOT NULL,
  moduleId INT NOT NULL,
  assignedTo INT NOT NULL,
  assignedBy INT NOT NULL,
  dueDate DATETIME NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
  completedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dealershipId) REFERENCES dealerships(id),
  FOREIGN KEY (moduleId) REFERENCES trainingModules(id),
  FOREIGN KEY (assignedTo) REFERENCES users(id),
  FOREIGN KEY (assignedBy) REFERENCES users(id),
  INDEX (dealershipId, status),
  INDEX (dueDate),
  INDEX (assignedTo)
);
```

## Integration Guide

### Adding Routes to App.tsx

The compliance training routes are already integrated:

```tsx
<Route path="/admin/compliance/audit-trail" component={ComplianceAuditTrail} />
<Route path="/admin/compliance/templates" component={CommunicationTemplateEditor} />
<Route path="/admin/compliance/training" component={TrainingModules} />
<Route path="/admin/compliance/assignments" component={TrainingAssignments} />
```

### Using in Your Code

**From React Components:**
```tsx
import { trpc } from "@/lib/trpc";

// Get audit trail
const { data: auditTrail } = trpc.complianceTraining.auditTrail.get.useQuery({
  dealershipId: 1,
  limit: 100
});

// Create template
const createMutation = trpc.complianceTraining.templates.create.useMutation({
  onSuccess: () => {
    console.log("Template created");
  }
});

await createMutation.mutateAsync({
  dealershipId: 1,
  name: "New Template",
  category: "email",
  body: "Template content"
});
```

**From Backend Code:**
```typescript
import { logAuditTrail, createTemplate, assignTraining } from "./server/_core/complianceTrainingServices";

// Log an action
await logAuditTrail(dealershipId, userId, "create", "template", templateId, "Created template");

// Create a template
const template = await createTemplate(
  dealershipId,
  "Template Name",
  "email",
  "Template body",
  userId
);

// Assign training
await assignTraining(dealershipId, moduleId, userId, assignedByUserId, dueDate);
```

## Background Jobs

### Setting Up Periodic Alert Checks

The system includes a function to run periodic compliance checks. Set up a background job to call this daily:

```typescript
import { runPeriodicTrainingAlerts } from "./server/_core/complianceTrainingAlerts";

// Call this daily (e.g., at 6 AM)
await runPeriodicTrainingAlerts();
```

**Recommended Schedule:** Daily at 6:00 AM UTC (8:00 AM SAST)

## Security Considerations

1. **Authentication:** All procedures require user authentication
2. **Authorization:** Admin-only operations are protected with role checks
3. **Audit Logging:** All actions are logged with user ID and timestamp
4. **Data Privacy:** Sensitive data is encrypted in transit and at rest
5. **Access Control:** Users can only view their own training progress

## Best Practices

1. **Template Approval:** Always require approval before using templates
2. **Regular Audits:** Review audit trail logs regularly for compliance
3. **Training Deadlines:** Set realistic deadlines for training assignments
4. **Progress Tracking:** Monitor training progress and follow up on incomplete assignments
5. **Documentation:** Keep records of all training completions for regulatory compliance

## Troubleshooting

### No Alerts Sent
- Verify email service is configured
- Check that `runPeriodicTrainingAlerts()` is being called
- Verify user email addresses are valid

### Templates Not Appearing
- Ensure templates are approved before use
- Check dealership ID matches
- Verify category filter is correct

### Progress Not Updating
- Verify user has started training
- Check module ID is correct
- Ensure progress percentage is between 0-100

## Future Enhancements

- Video player with progress tracking
- Quiz system with automated scoring
- Training completion certificates
- Advanced analytics and reporting
- Template library with pre-built templates
- Multi-language support for training content
- Mobile app for training access
- Integration with external LMS systems

## Support

For issues or questions, contact the development team or refer to the inline code documentation in the service files.
