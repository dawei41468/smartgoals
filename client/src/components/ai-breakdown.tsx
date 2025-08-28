import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Save, ChevronDown, ChevronUp, Plus, Clock, AlertTriangle, Lightbulb, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', estimatedHours: 1, day: 1, weekNumber: 1 });
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

  const handleAddTask = () => {
    const updatedBreakdown = { ...breakdown };
    const targetWeek = updatedBreakdown.weeklyGoals.find(w => w.weekNumber === newTask.weekNumber);
    
    if (targetWeek) {
      targetWeek.tasks.push({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority as 'high' | 'medium' | 'low',
        estimatedHours: newTask.estimatedHours,
        day: newTask.day
      });
      
      setBreakdown(updatedBreakdown);
      setShowAddTaskModal(false);
      setNewTask({ title: '', description: '', priority: 'medium', estimatedHours: 1, day: 1, weekNumber: 1 });
      
      toast({
        title: "Success",
        description: "Custom task added successfully!",
      });
    }
  };

  const handleAdjustTimeline = (weekNumber: number, newDuration: number) => {
    // Simple timeline adjustment - extend or compress weeks
    const updatedBreakdown = { ...breakdown };
    const currentWeeks = updatedBreakdown.weeklyGoals.length;
    
    if (newDuration > currentWeeks) {
      // Add weeks
      for (let i = currentWeeks + 1; i <= newDuration; i++) {
        updatedBreakdown.weeklyGoals.push({
          weekNumber: i,
          title: `Week ${i}: Additional Tasks`,
          description: `Extended timeline tasks for week ${i}`,
          tasks: []
        });
      }
    } else if (newDuration < currentWeeks) {
      // Remove weeks
      updatedBreakdown.weeklyGoals = updatedBreakdown.weeklyGoals.slice(0, newDuration);
    }
    
    setBreakdown(updatedBreakdown);
    setShowTimelineModal(false);
    
    toast({
      title: "Success",
      description: "Timeline adjusted successfully!",
    });
  };

  const moveTask = (fromWeek: number, taskIndex: number, direction: 'up' | 'down') => {
    const updatedBreakdown = { ...breakdown };
    const week = updatedBreakdown.weeklyGoals.find(w => w.weekNumber === fromWeek);
    
    if (!week || !week.tasks[taskIndex]) return;
    
    const newIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
    if (newIndex < 0 || newIndex >= week.tasks.length) return;
    
    // Swap tasks
    [week.tasks[taskIndex], week.tasks[newIndex]] = [week.tasks[newIndex], week.tasks[taskIndex]];
    
    setBreakdown(updatedBreakdown);
    
    toast({
      title: "Success",
      description: "Task reordered successfully!",
    });
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
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">AI-Generated Goal Breakdown</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Review and customize your weekly goals and daily tasks</p>
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
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4" data-testid="text-goal-title">
            Goal: {goalData.title || goalData.specific.substring(0, 50)}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Timeline:</span>
              <span className="text-sm text-gray-900 dark:text-gray-100 ml-2" data-testid="text-timeline">
                {totalWeeks} weeks
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Effort:</span>
              <span className="text-sm text-gray-900 dark:text-gray-100 ml-2" data-testid="text-effort">
                {estimatedHours} hours total
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Deadline:</span>
              <span className="text-sm text-gray-900 dark:text-gray-100 ml-2" data-testid="text-deadline">
                {new Date(goalData.deadline).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Breakdown */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Weekly Breakdown</h3>
          
          {breakdown.weeklyGoals.map((week) => (
            <div key={week.weekNumber} className="border border-gray-200 dark:border-gray-700 rounded-lg" data-testid={`week-${week.weekNumber}`}>
              <div className="bg-gray-50 dark:bg-gray-800 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start sm:items-center justify-between">
                  <div className="flex-1 min-w-0 pr-3">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words" data-testid={`text-week-title-${week.weekNumber}`}>
                      Week {week.weekNumber}: {week.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 break-words" data-testid={`text-week-description-${week.weekNumber}`}>
                      {week.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleWeek(week.weekNumber)}
                    data-testid={`button-toggle-week-${week.weekNumber}`}
                    className="flex-shrink-0"
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
                          <Checkbox className="mt-1 flex-shrink-0" data-testid={`checkbox-task-${week.weekNumber}-${taskIndex}`} />
                          <div className="flex-1 min-w-0">
                            <div className="mb-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white block mb-2" data-testid={`text-task-title-${week.weekNumber}-${taskIndex}`}>
                                {task.title}
                              </span>
                              <div className="flex flex-wrap gap-2">
                                <span className={`px-2 py-1 text-xs rounded flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded flex items-center flex-shrink-0">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {task.estimatedHours}h
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded flex-shrink-0">
                                  {getDayName(task.day)}
                                </span>
                              </div>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 break-words" data-testid={`text-task-description-${week.weekNumber}-${taskIndex}`}>
                                {task.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveTask(week.weekNumber, taskIndex, 'up')}
                              disabled={taskIndex === 0}
                              className="h-6 w-6 p-0"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveTask(week.weekNumber, taskIndex, 'down')}
                              disabled={taskIndex === week.tasks.length - 1}
                              className="h-6 w-6 p-0"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 mt-8">
          <div className="flex flex-col sm:flex-row sm:items-start">
            <Lightbulb className="text-yellow-500 mt-1 mr-0 sm:mr-3 h-5 w-5 mb-3 sm:mb-0 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-yellow-800 mb-2">Customize Your Breakdown</h4>
              <p className="text-yellow-700 text-sm mb-4 break-words">
                You can modify any task, add new ones, or adjust timelines. Click on any task to edit it, or use the buttons below for bulk changes.
              </p>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <Dialog open={showAddTaskModal} onOpenChange={setShowAddTaskModal}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-100 w-full sm:w-auto" data-testid="button-add-task">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-lg">
                    <DialogHeader>
                      <DialogTitle>Add Custom Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Task Title</label>
                        <Input
                          value={newTask.title}
                          onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                          placeholder="Enter task title"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={newTask.description}
                          onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                          placeholder="Task description (optional)"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Priority</label>
                          <Select value={newTask.priority} onValueChange={(value) => setNewTask({...newTask, priority: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Hours</label>
                          <Input
                            type="number"
                            min="1"
                            max="24"
                            value={newTask.estimatedHours}
                            onChange={(e) => setNewTask({...newTask, estimatedHours: parseInt(e.target.value) || 1})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Week</label>
                          <Select value={newTask.weekNumber.toString()} onValueChange={(value) => setNewTask({...newTask, weekNumber: parseInt(value)})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {breakdown.weeklyGoals.map(week => (
                                <SelectItem key={week.weekNumber} value={week.weekNumber.toString()}>
                                  Week {week.weekNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Day</label>
                          <Select value={newTask.day.toString()} onValueChange={(value) => setNewTask({...newTask, day: parseInt(value)})}>
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
                        <Button variant="outline" onClick={() => setShowAddTaskModal(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddTask} disabled={!newTask.title.trim()}>
                          Add Task
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showTimelineModal} onOpenChange={setShowTimelineModal}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-100 w-full sm:w-auto" data-testid="button-adjust-timeline">
                      <Clock className="h-4 w-4 mr-2" />
                      Adjust Timeline
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-lg">
                    <DialogHeader>
                      <DialogTitle>Adjust Timeline</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Current timeline: {breakdown.weeklyGoals.length} weeks
                      </p>
                      <div>
                        <label className="text-sm font-medium">New Duration (weeks)</label>
                        <Input
                          type="number"
                          min="1"
                          max="52"
                          defaultValue={breakdown.weeklyGoals.length}
                          onChange={(e) => {
                            const newDuration = parseInt(e.target.value) || breakdown.weeklyGoals.length;
                            if (newDuration !== breakdown.weeklyGoals.length) {
                              handleAdjustTimeline(0, newDuration);
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowTimelineModal(false)}>
                          Close
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-yellow-500 text-yellow-700 hover:bg-yellow-100 w-full sm:w-auto" 
                  data-testid="button-reorder-tasks"
                  onClick={() => {
                    toast({
                      title: "Reorder Tasks",
                      description: "Use the up/down arrows next to each task to reorder them within each week.",
                    });
                  }}
                >
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
