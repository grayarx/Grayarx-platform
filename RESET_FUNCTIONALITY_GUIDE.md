# Reset Functionality Guide

**Version:** 1.0  
**Date:** June 1, 2026  
**Status:** Complete & Production-Ready  

---

## Overview

The GrayArx dashboard now includes comprehensive reset functionality that allows users to easily revert customizations at both the widget and dashboard levels. The system includes confirmation dialogs, automatic backups, and a complete reset history for recovery.

---

## Features

### Widget Reset

1. **Reset Individual Widget** — Revert a single widget to default settings
2. **Reset Widget Theme Only** — Keep settings, revert appearance
3. **Reset Widget Settings Only** — Keep theme, revert configuration
4. **Confirmation Dialog** — Prevent accidental resets
5. **Automatic Backup** — Save state before reset

### Dashboard Reset

1. **Reset Entire Dashboard** — Revert all widgets to defaults
2. **Reset All Themes** — Keep settings, revert all appearances
3. **Reset All Settings** — Keep themes, revert all configurations
4. **Batch Operations** — Reset multiple widgets at once
5. **Automatic Backup** — Save dashboard state before reset

### Reset History & Recovery

1. **Reset History Dialog** — View all previous resets
2. **Restore from Backup** — Undo any reset operation
3. **Backup Management** — Delete or clear history
4. **Statistics** — Track reset activity
5. **LocalStorage Persistence** — Automatic backup storage

---

## Architecture

### Component Hierarchy

```
CustomizableDashboard
├── ResetConfirmationDialog
│   ├── Alert Dialog
│   ├── Confirmation Message
│   └── Action Buttons
├── ResetHistory
│   ├── Backup List
│   ├── Backup Details
│   ├── Restore Button
│   └── Delete Button
└── DraggableWidget
    └── Reset Button (in edit mode)
```

### Data Flow

```
User clicks Reset Button
    ↓
ResetConfirmationDialog (confirm action)
    ↓
createBackup (save current state)
    ↓
saveBackupToLocalStorage (persist backup)
    ↓
resetWidget/Dashboard (apply reset)
    ↓
Update UI (reflect changes)
    ↓
Toast notification (confirm completion)
```

---

## Usage Guide

### Reset Individual Widget

```tsx
import { useState } from 'react';
import { ResetConfirmationDialog } from '@/components/widgets/ResetConfirmationDialog';
import { resetWidgetToDefault, createWidgetBackup, saveBackupToLocalStorage } from '@/lib/resetUtils';

export function WidgetComponent({ widget, onUpdate }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    // Create backup
    const backup = createWidgetBackup(widget);
    saveBackupToLocalStorage(backup);

    // Reset widget
    const reset = resetWidgetToDefault(widget);
    onUpdate(widget.id, reset);

    setShowConfirm(false);
  };

  return (
    <>
      <button onClick={() => setShowConfirm(true)}>
        Reset Widget
      </button>

      <ResetConfirmationDialog
        isOpen={showConfirm}
        title="Reset Widget?"
        description="This will revert the widget to its default settings and appearance."
        itemName={widget.title}
        onConfirm={handleReset}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
```

### Reset Widget Theme Only

```tsx
import { resetWidgetTheme, createWidgetBackup, saveBackupToLocalStorage } from '@/lib/resetUtils';

const handleResetTheme = () => {
  const backup = createWidgetBackup(widget);
  saveBackupToLocalStorage(backup);

  const reset = resetWidgetTheme(widget);
  onUpdate(widget.id, reset);
};
```

### Reset Widget Settings Only

```tsx
import { resetWidgetSettings, createWidgetBackup, saveBackupToLocalStorage } from '@/lib/resetUtils';

const handleResetSettings = () => {
  const backup = createWidgetBackup(widget);
  saveBackupToLocalStorage(backup);

  const reset = resetWidgetSettings(widget);
  onUpdate(widget.id, reset);
};
```

### Reset Entire Dashboard

```tsx
import { resetDashboardToDefault, createDashboardBackup, saveBackupToLocalStorage } from '@/lib/resetUtils';

const handleResetDashboard = () => {
  const backup = createDashboardBackup(layout);
  saveBackupToLocalStorage(backup);

  const reset = resetDashboardToDefault(layout);
  onUpdate(reset);
};
```

### View Reset History

```tsx
import { ResetHistory } from '@/components/widgets/ResetHistory';
import { restoreFromBackup } from '@/lib/resetUtils';

const [showHistory, setShowHistory] = useState(false);

const handleRestore = (backup) => {
  const restored = restoreFromBackup(backup);
  onUpdate(restored);
};

<ResetHistory
  isOpen={showHistory}
  onClose={() => setShowHistory(false)}
  onRestore={handleRestore}
/>
```

---

## API Reference

### Reset Functions

#### `resetWidgetToDefault(widget: WidgetConfig)`
Resets a widget to default theme, settings, and configuration.

```tsx
const reset = resetWidgetToDefault(widget);
// Returns: WidgetConfig with defaults
```

#### `resetWidgetTheme(widget: WidgetConfig)`
Resets only the widget theme to default.

```tsx
const reset = resetWidgetTheme(widget);
// Keeps: settings, refreshInterval
// Resets: theme
```

#### `resetWidgetSettings(widget: WidgetConfig)`
Resets only the widget settings to default.

```tsx
const reset = resetWidgetSettings(widget);
// Keeps: theme
// Resets: settings, refreshInterval
```

#### `resetDashboardToDefault(layout: DashboardLayout)`
Resets all widgets in the dashboard to defaults.

```tsx
const reset = resetDashboardToDefault(layout);
// Returns: DashboardLayout with all widgets reset
```

#### `resetAllWidgetThemes(layout: DashboardLayout)`
Resets themes for all widgets in dashboard.

```tsx
const reset = resetAllWidgetThemes(layout);
// Keeps: all settings
// Resets: all themes
```

#### `resetAllWidgetSettings(layout: DashboardLayout)`
Resets settings for all widgets in dashboard.

```tsx
const reset = resetAllWidgetSettings(layout);
// Keeps: all themes
// Resets: all settings
```

### Backup Functions

#### `createWidgetBackup(widget: WidgetConfig)`
Creates a backup of a widget's current state.

```tsx
const backup = createWidgetBackup(widget);
// Returns: ResetBackup with widget state
```

#### `createDashboardBackup(layout: DashboardLayout)`
Creates a backup of the dashboard's current state.

```tsx
const backup = createDashboardBackup(layout);
// Returns: ResetBackup with dashboard state
```

#### `restoreFromBackup<T>(backup: ResetBackup)`
Restores state from a backup.

```tsx
const restored = restoreFromBackup<WidgetConfig>(backup);
// Returns: Original state from backup
```

### LocalStorage Functions

#### `saveBackupToLocalStorage(backup: ResetBackup)`
Saves a backup to browser localStorage.

```tsx
saveBackupToLocalStorage(backup);
// Keeps last 20 backups
```

#### `getBackupsFromLocalStorage()`
Retrieves all backups from localStorage.

```tsx
const backups = getBackupsFromLocalStorage();
// Returns: ResetBackup[]
```

#### `getLatestBackup()`
Gets the most recent backup.

```tsx
const latest = getLatestBackup();
// Returns: ResetBackup | null
```

#### `deleteBackup(backupId: string)`
Deletes a specific backup.

```tsx
deleteBackup(backupId);
```

#### `clearAllBackups()`
Deletes all backups.

```tsx
clearAllBackups();
```

#### `getBackupHistory(limit: number = 10)`
Gets backup history with optional limit.

```tsx
const history = getBackupHistory(5);
// Returns: Last 5 backups in reverse order
```

### Statistics

#### `getResetStatistics()`
Gets statistics about reset activity.

```tsx
const stats = getResetStatistics();
// Returns: {
//   totalResets: number,
//   widgetResets: number,
//   dashboardResets: number,
//   lastReset?: Date,
//   backupsAvailable: number
// }
```

---

## Components

### ResetConfirmationDialog

Confirmation dialog before performing a reset.

**Props:**
- `isOpen: boolean` — Dialog visibility
- `title: string` — Dialog title
- `description: string` — Confirmation message
- `itemName?: string` — Name of item being reset
- `isLoading?: boolean` — Loading state
- `onConfirm: () => void` — Confirm callback
- `onCancel: () => void` — Cancel callback
- `confirmText?: string` — Confirm button text (default: "Reset")
- `cancelText?: string` — Cancel button text (default: "Cancel")
- `isDangerous?: boolean` — Show warning style (default: true)

**Example:**
```tsx
<ResetConfirmationDialog
  isOpen={showConfirm}
  title="Reset Widget?"
  description="This will revert all customizations."
  itemName="Sales Dashboard"
  onConfirm={() => handleReset()}
  onCancel={() => setShowConfirm(false)}
/>
```

### ResetHistory

Dialog showing reset history and allowing restoration.

**Props:**
- `isOpen: boolean` — Dialog visibility
- `onClose: () => void` — Close callback
- `onRestore: (backup: ResetBackup) => void` — Restore callback

**Example:**
```tsx
<ResetHistory
  isOpen={showHistory}
  onClose={() => setShowHistory(false)}
  onRestore={(backup) => handleRestore(backup)}
/>
```

---

## Default Values

### DEFAULT_WIDGET_THEME

```typescript
{
  id: 'default-theme',
  name: 'Default',
  mode: 'light',
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  accentColor: '#3B82F6',
  borderColor: '#E5E7EB',
  borderRadius: 'md',
  borderWidth: 1,
  shadowSize: 'md',
  opacity: 100,
}
```

### Default Widget Configuration

```typescript
{
  isVisible: true,
  isLocked: false,
  theme: DEFAULT_WIDGET_THEME,
  refreshInterval: 300, // 5 minutes
  settings: {},
}
```

---

## Best Practices

### User Experience

1. **Always Confirm** — Show confirmation before destructive resets
2. **Clear Messaging** — Explain what will be reset
3. **Provide Recovery** — Always save backups before reset
4. **Show Feedback** — Toast notification after reset
5. **Undo Option** — Allow restoration from history

### Performance

1. **Lazy Load History** — Load backups on demand
2. **Limit Backups** — Keep only last 20 backups
3. **Batch Operations** — Reset multiple widgets at once
4. **Debounce Saves** — Avoid excessive localStorage writes
5. **Clean Up** — Periodically clear old backups

### Data Integrity

1. **Deep Copy** — Always backup creates deep copy
2. **Validation** — Validate reset state before applying
3. **Audit Trail** — Log all reset operations
4. **Recovery** — Always allow restoration
5. **Versioning** — Track backup timestamps

---

## Troubleshooting

### Reset Not Working

1. Check if widget is locked
2. Verify confirmation dialog was accepted
3. Check browser console for errors
4. Ensure localStorage is enabled
5. Try clearing cache

### Backup Not Saving

1. Check localStorage quota
2. Verify browser allows localStorage
3. Check for corrupted data
4. Clear old backups
5. Try in different browser

### Cannot Restore

1. Check backup exists in history
2. Verify backup data is valid
3. Check for localStorage corruption
4. Try manual restore from JSON
5. Contact support

### Performance Issues

1. Reduce number of backups
2. Clear old history
3. Optimize widget complexity
4. Check browser memory usage
5. Use performance profiler

---

## Examples

### Complete Reset Flow

```tsx
import { useState } from 'react';
import { ResetConfirmationDialog } from '@/components/widgets/ResetConfirmationDialog';
import { ResetHistory } from '@/components/widgets/ResetHistory';
import {
  resetWidgetToDefault,
  createWidgetBackup,
  saveBackupToLocalStorage,
  restoreFromBackup,
} from '@/lib/resetUtils';

export function DashboardWithReset() {
  const [widgets, setWidgets] = useState([...]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState(null);

  const handleResetWidget = async () => {
    if (selectedWidget) {
      // Create backup
      const backup = createWidgetBackup(selectedWidget);
      saveBackupToLocalStorage(backup);

      // Reset widget
      const reset = resetWidgetToDefault(selectedWidget);
      setWidgets((prev) =>
        prev.map((w) => (w.id === selectedWidget.id ? reset : w))
      );

      setShowConfirm(false);
      // Show toast: "Widget reset successfully"
    }
  };

  const handleRestore = (backup) => {
    const restored = restoreFromBackup(backup);
    setWidgets((prev) =>
      prev.map((w) => (w.id === restored.id ? restored : w))
    );
    setShowHistory(false);
    // Show toast: "Widget restored successfully"
  };

  return (
    <>
      <button onClick={() => setShowHistory(true)}>
        View Reset History
      </button>

      <ResetConfirmationDialog
        isOpen={showConfirm}
        title="Reset Widget?"
        description="This will revert all customizations."
        itemName={selectedWidget?.title}
        onConfirm={handleResetWidget}
        onCancel={() => setShowConfirm(false)}
      />

      <ResetHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onRestore={handleRestore}
      />
    </>
  );
}
```

---

## Support

For issues or questions:

1. Check this guide for solutions
2. Review component source code
3. Check browser console for errors
4. Test in different browsers
5. Contact development team

---

**Document Version:** 1.0  
**Last Updated:** June 1, 2026  
**Status:** COMPLETE & PRODUCTION-READY
