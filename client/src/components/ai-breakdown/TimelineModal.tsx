import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeeks: number;
  onAdjustTimeline: (oldDuration: number, newDuration: number) => void;
}

export function TimelineModal({
  isOpen,
  onClose,
  currentWeeks,
  onAdjustTimeline
}: TimelineModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>Adjust Timeline</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Current timeline: {currentWeeks} weeks
          </p>
          <div>
            <label className="text-sm font-medium">New Duration (weeks)</label>
            <Input
              type="number"
              min="1"
              max="52"
              defaultValue={currentWeeks}
              onChange={(e) => {
                const newDuration = parseInt(e.target.value) || currentWeeks;
                if (newDuration !== currentWeeks) {
                  onAdjustTimeline(0, newDuration);
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
