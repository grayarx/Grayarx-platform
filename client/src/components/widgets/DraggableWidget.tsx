import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { GripHorizontal, X, Settings, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DraggableWidgetProps } from '@/types/widgets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Draggable Widget Container
 * Wraps widgets with drag-and-drop functionality and controls
 */
export const DraggableWidget: React.FC<any> = ({
  id,
  config,
  index,
  isEditing,
  isDraggingOver,
  isDragging,
  onUpdate,
  onRemove,
  onReset,
  children,
}) => {
  const sizeClasses: Record<string, string> = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-2 row-span-1',
    large: 'col-span-2 row-span-2',
    full: 'col-span-full',
  };

  return (
    <Draggable draggableId={id} index={index} isDragDisabled={!isEditing || config.isLocked}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            sizeClasses[config.size as string],
            'transition-all duration-200',
            snapshot.isDragging && 'opacity-50 shadow-2xl',
            isDraggingOver && 'ring-2 ring-primary',
            !isEditing && 'cursor-default'
          )}
        >
          <Card
            className={cn(
              'h-full flex flex-col',
              isEditing && 'border-dashed border-2 border-muted-foreground/50',
              snapshot.isDragging && 'shadow-xl'
            )}
          >
            {/* Widget Header */}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  {isEditing && !config.isLocked && (
                    <div
                      {...provided.dragHandleProps}
                      className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                    >
                      <GripHorizontal className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <CardTitle className="text-sm font-semibold truncate">
                    {config.title}
                  </CardTitle>
                </div>

                {/* Widget Controls */}
                {isEditing && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => onUpdate?.({ ...config, isLocked: !config.isLocked })}
                      title={config.isLocked ? 'Unlock widget' : 'Lock widget'}
                    >
                      {config.isLocked ? '🔒' : '🔓'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => onUpdate?.({ ...config })}
                      title="Widget settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={onReset}
                      title="Reset widget to default"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={onRemove}
                      title="Remove widget"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            {/* Widget Content */}
            <CardContent className="flex-1 overflow-auto">
              {children}
            </CardContent>

            {/* Widget Footer - Refresh Info */}
            {config.lastRefreshed && (
              <div className="px-4 py-2 border-t text-xs text-muted-foreground">
                Last updated: {new Date(config.lastRefreshed).toLocaleTimeString()}
              </div>
            )}
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default DraggableWidget;
