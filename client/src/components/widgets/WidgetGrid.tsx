import React from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { cn } from '@/lib/utils';
import { WidgetConfig } from '@/types/widgets';
import { DraggableWidget } from './DraggableWidget';

export interface WidgetGridProps {
  widgets: WidgetConfig[];
  isEditing: boolean;
  onReorder: (widgets: WidgetConfig[]) => void;
  onUpdateWidget: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  onRemoveWidget: (widgetId: string) => void;
  renderWidget: (config: WidgetConfig) => React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4 | 6;
}

/**
 * Responsive Widget Grid with Drag-and-Drop
 * Manages layout and reordering of widgets
 */
export const WidgetGrid: React.FC<WidgetGridProps> = ({
  widgets,
  isEditing,
  onReorder,
  onUpdateWidget,
  onRemoveWidget,
  renderWidget,
  className,
  columns = 4,
}) => {
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // If dropped outside the list, do nothing
    if (!destination) return;

    // If dropped in the same position, do nothing
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Reorder widgets
    const newWidgets = Array.from(widgets);
    const [movedWidget] = newWidgets.splice(source.index, 1);
    newWidgets.splice(destination.index, 0, movedWidget);

    // Update positions
    const updatedWidgets = newWidgets.map((widget, index) => ({
      ...widget,
      position: index,
    }));

    onReorder(updatedWidgets);
  };

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="widgets-grid" type="WIDGET">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'grid gap-4 auto-rows-max',
              gridColsClass[columns],
              snapshot.isDraggingOver && 'bg-muted/30 rounded-lg p-4 transition-colors',
              className
            )}
          >
            {widgets.map((widget, index) => (
              <DraggableWidget
                key={widget.id}
                id={widget.id}
                index={index}
                config={widget}
                isEditing={isEditing}
                isDraggingOver={snapshot.isDraggingOver}
                onUpdate={(updates: any) => onUpdateWidget(widget.id, updates)}
                onRemove={() => onRemoveWidget(widget.id)}
              >
                {renderWidget(widget)}
              </DraggableWidget>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default WidgetGrid;
