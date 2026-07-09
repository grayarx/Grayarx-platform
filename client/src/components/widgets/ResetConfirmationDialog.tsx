import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export interface ResetConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemName?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

/**
 * Reset Confirmation Dialog
 * Confirms before resetting widgets or dashboard
 */
export const ResetConfirmationDialog: React.FC<ResetConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  itemName,
  isLoading = false,
  onConfirm,
  onCancel,
  confirmText = 'Reset',
  cancelText = 'Cancel',
  isDangerous = true,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Reset failed:', error);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            {isDangerous ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
            )}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription className="space-y-3">
          <p>{description}</p>
          {itemName && (
            <p className="font-semibold text-foreground">
              Item: <span className="text-primary">{itemName}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            This action cannot be undone. Make sure you want to proceed.
          </p>
        </AlertDialogDescription>

        <div className="flex gap-2 justify-end">
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={isDangerous ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isLoading ? 'Resetting...' : confirmText}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ResetConfirmationDialog;
