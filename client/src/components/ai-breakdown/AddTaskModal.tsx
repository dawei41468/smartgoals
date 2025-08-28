import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface NewTask {
  title: string;
  description: string;
  priority: string;
  estimatedHours: number;
  day: number;
  weekNumber: number;
}

interface WeeklyGoal {
  weekNumber: number;
  title: string;
  description: string;
  tasks: any[];
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTask: NewTask;
  onTaskChange: (task: NewTask) => void;
  onAddTask: () => void;
  weeklyGoals: WeeklyGoal[];
  getDayName: (day: number) => string;
}

export function AddTaskModal({
  isOpen,
  onClose,
  newTask,
  onTaskChange,
  onAddTask,
  weeklyGoals,
  getDayName
}: AddTaskModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Task Title</label>
            <Input
              placeholder="Enter task title..."
              value={newTask.title}
              onChange={(e) => onTaskChange({...newTask, title: e.target.value})}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              placeholder="Enter task description..."
              value={newTask.description}
              onChange={(e) => onTaskChange({...newTask, description: e.target.value})}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select value={newTask.priority} onValueChange={(value: string) => onTaskChange({...newTask, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Estimated Hours</label>
              <Input
                type="number"
                min="1"
                max="24"
                value={newTask.estimatedHours}
                onChange={(e) => onTaskChange({...newTask, estimatedHours: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Week</label>
              <Select value={newTask.weekNumber.toString()} onValueChange={(value) => onTaskChange({...newTask, weekNumber: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weeklyGoals.map(week => (
                    <SelectItem key={week.weekNumber} value={week.weekNumber.toString()}>
                      Week {week.weekNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Day</label>
              <Select value={newTask.day.toString()} onValueChange={(value) => onTaskChange({...newTask, day: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7].map(day => (
                    <SelectItem key={day} value={day.toString()}>
                      {getDayName(day)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onAddTask} disabled={!newTask.title.trim()}>
              Add Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
