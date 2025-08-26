import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Save, ChevronDown, ChevronUp, Plus, Clock, AlertTriangle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { InsertGoal, AIBreakdownRequest, AIBreakdownResponse } from "@/lib/schema";
import { api } from "@/lib/api";

interface AIBreakdownProps {
  goalData: InsertGoal;
  breakdownRequest: AIBreakdownRequest;
  breakdown: AIBreakdownResponse;
  onSaveComplete: () => void;
}

export default function AIBreakdown({ goalData, breakdownRequest, breakdown: initialBreakdown, onSaveComplete }: AIBreakdownProps) {
  const [breakdown, setBreakdown] = useState(initialBreakdown);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1, 2]));
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleWeek = (weekNumber: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber);
    } else {
      newExpanded.add(weekNumber);
    }
    setExpandedWeeks(newExpanded);
  };

  const regenerateMutation = useMutation({
    mutationFn: () => api.regenerateBreakdown(breakdownRequest),
    onSuccess: (newBreakdown) => {
      setBreakdown(newBreakdown);
      toast({
        title: "Success",
        description: "Goal breakdown regenerated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to regenerate breakdown. Please try again.",
        variant: "destructive",
      });
      console.error("Regeneration error:", error);
    },
  });

  const saveGoalMutation = useMutation({
    mutationFn: () => api.saveCompleteGoal(goalData, breakdown),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      toast({
        title: "Success",
        description: "Your SMART(ER) goal has been saved successfully!",
      });
      onSaveComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save goal. Please try again.",
        variant: "destructive",
      });
      console.error("Save error:", error);
    },
  });

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await regenerateMutation.mutateAsync();
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = () => {
    saveGoalMutation.mutate();
  };

  const getDayName = (day: number) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days[day - 1] || `Day ${day}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700";
      case "medium": return "bg-yellow-100 text-yellow-700";
      case "low": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getWeekBorderColor = (weekNumber: number) => {
    const colors = ["border-l-primary", "border-l-secondary", "border-l-accent", "border-l-purple-500", "border-l-pink-500"];
    return colors[(weekNumber - 1) % colors.length];
  };

  // Calculate total weeks and timeline
  const totalWeeks = breakdown.weeklyGoals.length;
  const estimatedHours = breakdown.weeklyGoals.reduce((total, week) => 
    total + week.tasks.reduce((weekTotal, task) => weekTotal + task.estimatedHours, 0), 0
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">AI-Generated Goal Breakdown</h1>
            <p className="text-sm sm:text-base text-gray-600">Review and customize your weekly goals and daily tasks</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button 
              variant="outline" 
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="w-full sm:w-auto"
              data-testid="button-regenerate"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveGoalMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-save-goal"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveGoalMutation.isPending ? "Saving..." : "Save Goal"}
            </Button>
          </div>
        </div>

        {/* Goal Summary */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4" data-testid="text-goal-title">
            Goal: {goalData.title || goalData.specific.substring(0, 50)}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Timeline:</span>
              <span className="text-sm text-gray-900 ml-2" data-testid="text-timeline">
                {totalWeeks} weeks
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Estimated Effort:</span>
              <span className="text-sm text-gray-900 ml-2" data-testid="text-effort">
                {estimatedHours} hours total
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Deadline:</span>
              <span className="text-sm text-gray-900 ml-2" data-testid="text-deadline">
                {new Date(goalData.deadline).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Breakdown */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">Weekly Breakdown</h3>
          
          {breakdown.weeklyGoals.map((week) => (
            <div key={week.weekNumber} className="border border-gray-200 rounded-lg" data-testid={`week-${week.weekNumber}`}>
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900" data-testid={`text-week-title-${week.weekNumber}`}>
                      Week {week.weekNumber}: {week.title}
                    </h4>
                    <p className="text-gray-600 text-sm mt-1" data-testid={`text-week-description-${week.weekNumber}`}>
                      {week.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleWeek(week.weekNumber)}
                    data-testid={`button-toggle-week-${week.weekNumber}`}
                  >
                    {expandedWeeks.has(week.weekNumber) ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </div>
              
              {expandedWeeks.has(week.weekNumber) && (
                <div className="p-4 sm:p-6">
                  <div className={`border-l-4 ${getWeekBorderColor(week.weekNumber)} pl-4`}>
                    <div className="space-y-4">
                      {week.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="flex items-start space-x-3" data-testid={`task-${week.weekNumber}-${taskIndex}`}>
                          <Checkbox className="mt-1" data-testid={`checkbox-task-${week.weekNumber}-${taskIndex}`} />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900" data-testid={`text-task-title-${week.weekNumber}-${taskIndex}`}>
                                {task.title}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {task.estimatedHours}h
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {getDayName(task.day)}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600" data-testid={`text-task-description-${week.weekNumber}-${taskIndex}`}>
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modification Tools */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <div className="flex items-start">
            <Lightbulb className="text-yellow-500 mt-1 mr-3 h-5 w-5" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-2">Customize Your Breakdown</h4>
              <p className="text-yellow-700 text-sm mb-4">
                You can modify any task, add new ones, or adjust timelines. Click on any task to edit it, or use the buttons below for bulk changes.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-100" data-testid="button-add-task">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Task
                </Button>
                <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-100" data-testid="button-adjust-timeline">
                  <Clock className="h-4 w-4 mr-2" />
                  Adjust Timeline
                </Button>
                <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-100" data-testid="button-reorder-tasks">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Reorder Tasks
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
