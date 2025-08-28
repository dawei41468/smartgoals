import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { InsertGoal, AIBreakdownRequest, AIBreakdownResponse } from "@/lib/schema";
import { api } from "@/lib/api";
import { BreakdownHeader } from "@/components/ai-breakdown/BreakdownHeader";
import { GoalSummaryCard } from "@/components/ai-breakdown/GoalSummaryCard";
import { WeeklyBreakdownSection } from "@/components/ai-breakdown/WeeklyBreakdownSection";
import { CustomizationTools } from "@/components/ai-breakdown/CustomizationTools";
import { AddTaskModal } from "@/components/ai-breakdown/AddTaskModal";
import { TimelineModal } from "@/components/ai-breakdown/TimelineModal";

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
      <BreakdownHeader
        onRegenerate={handleRegenerate}
        onSave={handleSave}
        isRegenerating={isRegenerating}
        isSaving={saveGoalMutation.isPending}
      />

      <GoalSummaryCard
        goalData={goalData}
        totalWeeks={totalWeeks}
        estimatedHours={estimatedHours}
      />

      <WeeklyBreakdownSection
        weeklyGoals={breakdown.weeklyGoals}
        expandedWeeks={expandedWeeks}
        onToggleWeek={toggleWeek}
        onMoveTask={moveTask}
        getWeekBorderColor={getWeekBorderColor}
        getPriorityColor={getPriorityColor}
        getDayName={getDayName}
      />

      <CustomizationTools
        onAddTask={() => setShowAddTaskModal(true)}
        onAdjustTimeline={() => setShowTimelineModal(true)}
      />

      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        newTask={newTask}
        onTaskChange={setNewTask}
        onAddTask={handleAddTask}
        weeklyGoals={breakdown.weeklyGoals}
        getDayName={getDayName}
      />

      <TimelineModal
        isOpen={showTimelineModal}
        onClose={() => setShowTimelineModal(false)}
        currentWeeks={breakdown.weeklyGoals.length}
        onAdjustTimeline={handleAdjustTimeline}
      />
    </div>
  );
}
