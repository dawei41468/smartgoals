import React from 'react';
import { Plus, Clock, AlertTriangle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CustomizationToolsProps {
  onAddTask: () => void;
  onAdjustTimeline: () => void;
}

export function CustomizationTools({ onAddTask, onAdjustTimeline }: CustomizationToolsProps) {
  const { toast } = useToast();

  const handleReorderTasks = () => {
    toast({
      title: "Reorder Tasks",
      description: "Use the up/down arrows next to each task to reorder them within each week.",
    });
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 mt-8">
      <div className="flex flex-col sm:flex-row sm:items-start">
        <Lightbulb className="text-yellow-500 mt-1 mr-0 sm:mr-3 h-5 w-5 mb-3 sm:mb-0 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-yellow-800 mb-2">Customize Your Breakdown</h4>
          <p className="text-yellow-700 text-sm mb-4 break-words">
            You can modify any task, add new ones, or adjust timelines. Click on any task to edit it, or use the buttons below for bulk changes.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button 
              size="sm" 
              variant="outline" 
              className="border-yellow-500 text-yellow-700 hover:bg-yellow-100 w-full sm:w-auto" 
              data-testid="button-add-task"
              onClick={onAddTask}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>

            <Button 
              size="sm" 
              variant="outline" 
              className="border-yellow-500 text-yellow-700 hover:bg-yellow-100 w-full sm:w-auto" 
              data-testid="button-adjust-timeline"
              onClick={onAdjustTimeline}
            >
              <Clock className="h-4 w-4 mr-2" />
              Adjust Timeline
            </Button>

            <Button 
              size="sm" 
              variant="outline" 
              className="border-yellow-500 text-yellow-700 hover:bg-yellow-100 w-full sm:w-auto" 
              data-testid="button-reorder-tasks"
              onClick={handleReorderTasks}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Reorder Tasks
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
