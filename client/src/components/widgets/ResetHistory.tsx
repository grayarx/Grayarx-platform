import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, RotateCcw, Clock } from 'lucide-react';
import {
  getBackupHistory,
  deleteBackup,
  clearAllBackups,
  formatBackupTime,
  ResetBackup,
} from '@/lib/resetUtils';

export interface ResetHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (backup: ResetBackup) => void;
}

/**
 * Reset History Dialog
 * Shows history of resets and allows restoration
 */
export const ResetHistory: React.FC<ResetHistoryProps> = ({
  isOpen,
  onClose,
  onRestore,
}) => {
  const [backups, setBackups] = useState<ResetBackup[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<ResetBackup | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBackups(getBackupHistory());
    }
  }, [isOpen]);

  const handleDelete = (backupId: string) => {
    deleteBackup(backupId);
    setBackups((prev) => prev.filter((b) => b.id !== backupId));
    if (selectedBackup?.id === backupId) {
      setSelectedBackup(null);
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all reset history? This cannot be undone.')) {
      clearAllBackups();
      setBackups([]);
      setSelectedBackup(null);
    }
  };

  const handleRestore = (backup: ResetBackup) => {
    if (confirm(`Restore to ${formatBackupTime(backup.timestamp)}?`)) {
      onRestore(backup);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Reset History
          </DialogTitle>
          <DialogDescription>
            View and restore previous widget and dashboard configurations
          </DialogDescription>
        </DialogHeader>

        {backups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No reset history available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Backups are created when you reset widgets or the dashboard
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Backup List */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Backups ({backups.length})</h3>
              <ScrollArea className="h-64 border rounded-lg p-2">
                <div className="space-y-2">
                  {backups.map((backup) => (
                    <button
                      key={backup.id}
                      onClick={() => setSelectedBackup(backup)}
                      className={`w-full text-left p-2 rounded border-2 transition-all ${
                        selectedBackup?.id === backup.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {backup.itemName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatBackupTime(backup.timestamp)}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {backup.type === 'widget' ? 'Widget' : 'Dashboard'}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Backup Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Details</h3>
              {selectedBackup ? (
                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedBackup.itemName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <Badge>
                      {selectedBackup.type === 'widget' ? 'Widget' : 'Dashboard'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm">
                      {new Date(selectedBackup.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ID</p>
                    <p className="text-xs font-mono text-muted-foreground">
                      {selectedBackup.id}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleRestore(selectedBackup)}
                      className="flex-1 gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restore
                    </Button>
                    <Button
                      onClick={() => handleDelete(selectedBackup.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4 text-center text-muted-foreground">
                  Select a backup to view details
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {backups.length > 0 && (
          <div className="flex gap-2 justify-between pt-4 border-t">
            <Button
              onClick={handleClearAll}
              variant="destructive"
              size="sm"
            >
              Clear All History
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResetHistory;
