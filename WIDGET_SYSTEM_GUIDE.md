# Drag-and-Drop Widget System Guide

**Version:** 1.0  
**Date:** June 1, 2026  
**Status:** Complete & Production-Ready  

---

## Overview

The GrayArx dashboard now features a comprehensive drag-and-drop customizable widget layout system. Users can rearrange dashboard components, add/remove widgets, apply presets, and save their preferred layouts with full persistence.

---

## Features

### Core Functionality

1. **Drag-and-Drop Reordering** — Intuitive widget rearrangement with visual feedback
2. **Add/Remove Widgets** — Dynamically add new widgets or remove existing ones
3. **Widget Locking** — Lock important widgets to prevent accidental moves
4. **Layout Presets** — Pre-configured layouts optimized for different roles
5. **Layout Persistence** — Save custom layouts locally and restore them
6. **Responsive Grid** — Automatic responsive layout across all screen sizes
7. **Edit Mode** — Toggle between view and edit modes
8. **Visual Feedback** — Smooth animations and clear status indicators

---

## Architecture

### Component Structure

```
CustomizableDashboard (Main Container)
├── WidgetToolbar (Controls)
│   ├── Edit Mode Toggle
│   ├── Add Widget Dropdown
│   ├── Reset Layout Button
│   ├── Apply Preset Dropdown
│   └── Save Changes Button
└── WidgetGrid (Layout Manager)
    ├── DraggableWidget (Individual Widget)
    │   ├── Drag Handle
    │   ├── Widget Content
    │   ├── Controls (Lock, Settings, Remove)
    │   └── Refresh Info
    └── ... (Multiple widgets)
```

### Data Flow

```
WidgetContext (Global State)
├── Layouts Management
├── Widget CRUD Operations
├── Layout Persistence
└── Preset Management
    ↓
WidgetProvider (State Provider)
    ↓
useWidgets Hook (Component Access)
    ↓
CustomizableDashboard (UI Layer)
```

---

## Usage Guide

### Basic Setup

1. **Wrap your app with WidgetProvider:**

```tsx
import { WidgetProvider } from '@/contexts/WidgetContext';

export function App() {
  return (
    <WidgetProvider>
      <YourApp />
    </WidgetProvider>
  );
}
```

2. **Use CustomizableDashboard component:**

```tsx
import { CustomizableDashboard } from '@/components/widgets/CustomizableDashboard';

export function DashboardPage() {
  return (
    <div className="p-6">
      <CustomizableDashboard />
    </div>
  );
}
```

### Using the Widget Hook

```tsx
import { useWidgets } from '@/contexts/WidgetContext';

export function MyComponent() {
  const {
    state,
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
    saveLayout,
    loadLayout,
    createLayout,
    deleteLayout,
    setEditMode,
    resetToDefault,
    applyPreset,
  } = useWidgets();

  // Access current layout
  const currentLayout = state.currentLayout;
  const isEditMode = state.isEditMode;
  const widgets = currentLayout?.widgets || [];

  // Add a new widget
  const handleAddWidget = () => {
    addWidget({
      id: `widget-${Date.now()}`,
      type: 'kpi-card',
      title: 'New Widget',
      size: 'medium',
      position: widgets.length,
      isVisible: true,
    });
  };

  // Remove a widget
  const handleRemoveWidget = (widgetId: string) => {
    removeWidget(widgetId);
  };

  // Update widget settings
  const handleUpdateWidget = (widgetId: string) => {
    updateWidget(widgetId, {
      title: 'Updated Title',
      size: 'large',
    });
  };

  // Save current layout
  const handleSaveLayout = async () => {
    if (currentLayout) {
      await saveLayout(currentLayout);
    }
  };

  return (
    <div>
      <button onClick={handleAddWidget}>Add Widget</button>
      <button onClick={handleSaveLayout}>Save Layout</button>
    </div>
  );
}
```

---

## Widget Types

| Type | Icon | Description | Default Size |
|------|------|-------------|--------------|
| `kpi-card` | 📊 | Key Performance Indicator | small |
| `chart` | 📈 | Data visualization chart | large |
| `table` | 📋 | Data table | large |
| `activity-feed` | 📝 | Recent activity list | medium |
| `leads-summary` | 👥 | Leads overview | medium |
| `conversion-metrics` | 🎯 | Conversion data | small |
| `response-time` | ⏱️ | Response time metrics | small |
| `bookings` | 📅 | Booking information | medium |

---

## Widget Sizes

| Size | Grid Span | Use Case |
|------|-----------|----------|
| `small` | 1 column | KPIs, single metrics |
| `medium` | 2 columns | Charts, tables, feeds |
| `large` | 2x2 grid | Large charts, dashboards |
| `full` | Full width | Full-width components |

---

## Layout Presets

### Available Presets

1. **Sales Focus** — Optimized for sales teams
   - Total Leads
   - Conversion Rate
   - Lead Trends Chart

2. **Operations Focus** — Optimized for operations teams
   - Response Time
   - Bookings
   - Activity Feed

### Creating Custom Presets

```tsx
const customPreset: LayoutPreset = {
  id: 'preset-custom',
  name: 'My Custom Layout',
  description: 'Tailored for my workflow',
  widgets: [
    {
      id: 'widget-1',
      type: 'kpi-card',
      title: 'Total Leads',
      size: 'small',
      position: 0,
      isVisible: true,
    },
    // ... more widgets
  ],
};
```

---

## API Reference

### WidgetContext Methods

#### `addWidget(widget: WidgetConfig)`
Adds a new widget to the current layout.

```tsx
addWidget({
  id: 'widget-1',
  type: 'kpi-card',
  title: 'New Widget',
  size: 'medium',
  position: 0,
  isVisible: true,
});
```

#### `removeWidget(widgetId: string)`
Removes a widget from the layout.

```tsx
removeWidget('widget-1');
```

#### `updateWidget(widgetId: string, updates: Partial<WidgetConfig>)`
Updates widget properties.

```tsx
updateWidget('widget-1', {
  title: 'Updated Title',
  size: 'large',
  isLocked: true,
});
```

#### `reorderWidgets(widgets: WidgetConfig[])`
Reorders widgets in the layout.

```tsx
reorderWidgets([widget2, widget1, widget3]);
```

#### `saveLayout(layout: DashboardLayout)`
Saves the current layout to localStorage.

```tsx
await saveLayout(currentLayout);
```

#### `loadLayout(layoutId: string)`
Loads a previously saved layout.

```tsx
await loadLayout('layout-1');
```

#### `createLayout(name: string)`
Creates a new layout with the current widgets.

```tsx
const newLayout = await createLayout('My New Layout');
```

#### `deleteLayout(layoutId: string)`
Deletes a saved layout.

```tsx
await deleteLayout('layout-1');
```

#### `setEditMode(isEdit: boolean)`
Toggles edit mode on/off.

```tsx
setEditMode(true);
```

#### `resetToDefault()`
Resets layout to the default configuration.

```tsx
await resetToDefault();
```

#### `applyPreset(presetId: string)`
Applies a preset layout.

```tsx
await applyPreset('preset-1');
```

---

## Widget Configuration

### WidgetConfig Interface

```tsx
interface WidgetConfig {
  id: string;                    // Unique identifier
  type: WidgetType;              // Widget type
  title: string;                 // Display title
  description?: string;          // Optional description
  size: WidgetSize;              // small | medium | large | full
  position: number;              // Order in layout
  isVisible: boolean;            // Show/hide widget
  isLocked?: boolean;            // Prevent dragging
  settings?: Record<string, any>; // Custom settings
  refreshInterval?: number;      // Auto-refresh in seconds
  lastRefreshed?: Date;          // Last refresh timestamp
}
```

### Example Widget Configuration

```tsx
const widget: WidgetConfig = {
  id: 'widget-sales-chart',
  type: 'chart',
  title: 'Sales Trends',
  description: 'Monthly sales performance',
  size: 'large',
  position: 0,
  isVisible: true,
  isLocked: false,
  settings: {
    chartType: 'line',
    timeRange: '30d',
    showLegend: true,
  },
  refreshInterval: 300, // 5 minutes
  lastRefreshed: new Date(),
};
```

---

## Persistence

### LocalStorage

Layouts are automatically saved to localStorage with key `dashboardLayout`.

```tsx
// Automatic save on layout change
const handleSaveLayout = async () => {
  await saveLayout(currentLayout);
  // Saved to localStorage
};

// Automatic load on mount
useEffect(() => {
  const savedLayout = localStorage.getItem('dashboardLayout');
  if (savedLayout) {
    const parsed = JSON.parse(savedLayout);
    setCurrentLayout(parsed);
  }
}, []);
```

### Backend Integration

To persist layouts to a database:

```tsx
// Create a tRPC mutation
export const router = t.router({
  layout: t.router({
    save: protectedProcedure
      .input(z.object({ layout: z.any() }))
      .mutation(async ({ ctx, input }) => {
        return await db.dashboardLayouts.create({
          userId: ctx.user.id,
          layout: input.layout,
        });
      }),
    load: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.dashboardLayouts.findFirst({
          where: { userId: ctx.user.id },
        });
      }),
  }),
});
```

---

## Customization

### Styling

Widgets use Tailwind CSS and shadcn/ui components. Customize by:

1. **Modifying component classes:**

```tsx
<div className="custom-widget-class">
  {/* Custom styling */}
</div>
```

2. **Extending WidgetConfig:**

```tsx
interface CustomWidgetConfig extends WidgetConfig {
  customColor?: string;
  customIcon?: string;
}
```

3. **Creating custom widget components:**

```tsx
export function CustomWidget({ config }: { config: WidgetConfig }) {
  return (
    <div className="custom-widget">
      {/* Custom implementation */}
    </div>
  );
}
```

### Adding Custom Widget Types

1. **Extend WidgetType:**

```tsx
export type WidgetType = 
  | 'kpi-card'
  | 'chart'
  | 'custom-widget'; // New type
```

2. **Register in widget registry:**

```tsx
const widgetRegistry: WidgetRegistry = {
  'custom-widget': {
    name: 'Custom Widget',
    description: 'My custom widget',
    icon: '🎨',
    defaultSize: 'medium',
    minWidth: 300,
    minHeight: 200,
    component: CustomWidget,
    configurable: true,
  },
};
```

---

## Best Practices

### Layout Design

1. **Balance widget sizes** — Mix small and large widgets for visual hierarchy
2. **Logical grouping** — Place related widgets together
3. **Minimize scrolling** — Keep important widgets above the fold
4. **Consistent spacing** — Use grid gaps for visual rhythm

### Performance

1. **Lazy load widgets** — Load widget content on demand
2. **Memoize components** — Prevent unnecessary re-renders
3. **Debounce reorders** — Batch layout updates
4. **Optimize refresh intervals** — Avoid excessive API calls

### Accessibility

1. **Keyboard navigation** — All controls keyboard accessible
2. **ARIA labels** — Proper labels for screen readers
3. **Color contrast** — Sufficient contrast for visibility
4. **Focus management** — Clear focus indicators

### User Experience

1. **Visual feedback** — Show loading states and animations
2. **Undo/Redo** — Consider implementing undo functionality
3. **Helpful hints** — Tooltips for drag-and-drop
4. **Quick presets** — Provide role-based layout presets

---

## Troubleshooting

### Widgets Not Dragging

1. Check that `isEditMode` is `true`
2. Verify widget is not locked (`isLocked !== true`)
3. Check browser console for errors
4. Ensure WidgetProvider wraps the component

### Layout Not Persisting

1. Check localStorage is enabled
2. Verify `saveLayout` is called after changes
3. Check browser storage quota
4. Clear cache and reload

### Performance Issues

1. Reduce number of widgets
2. Increase refresh intervals
3. Lazy load widget content
4. Use React.memo for widget components

### Drag-and-Drop Not Working

1. Verify react-beautiful-dnd is installed
2. Check DragDropContext wraps the grid
3. Verify Droppable has correct droppableId
4. Check z-index conflicts with other elements

---

## Examples

### Complete Dashboard Setup

```tsx
import { CustomizableDashboard } from '@/components/widgets/CustomizableDashboard';
import { WidgetProvider } from '@/contexts/WidgetContext';

export function Dashboard() {
  return (
    <WidgetProvider>
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <CustomizableDashboard />
      </div>
    </WidgetProvider>
  );
}
```

### Custom Widget Component

```tsx
import { WidgetProps } from '@/types/widgets';

export function SalesWidget({ config, isEditing }: WidgetProps) {
  return (
    <div className="space-y-4">
      <div className="text-3xl font-bold">$125,000</div>
      <div className="text-sm text-muted-foreground">
        Total sales this month
      </div>
      {isEditing && (
        <div className="text-xs text-yellow-600">
          ⚠️ Editing mode active
        </div>
      )}
    </div>
  );
}
```

### Programmatic Layout Creation

```tsx
const { createLayout, applyPreset } = useWidgets();

const handleCreateSalesLayout = async () => {
  const layout = await createLayout('Sales Dashboard');
  await applyPreset('preset-sales-focus');
};
```

---

## Future Enhancements

1. **Undo/Redo** — Implement undo/redo for layout changes
2. **Widget Resizing** — Allow manual widget resizing
3. **Custom Colors** — Per-widget color customization
4. **Export/Import** — Export layouts as JSON
5. **Sharing** — Share layouts with team members
6. **Analytics** — Track widget usage and popularity
7. **Animations** — Enhanced transition animations
8. **Mobile Optimization** — Touch-friendly drag-and-drop

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
