import { useEffect, useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import Navigation from "@/components/navigation";
import GoalWizard from "@/components/goal-wizard";
import AIBreakdown from "@/components/ai-breakdown";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { withErrorBoundary } from "@/components/ErrorBoundary";
import { GoalHeader } from "@/components/my-goals/GoalHeader";
import { GoalFilters } from "@/components/my-goals/GoalFilters";
import { GoalEmptyState } from "@/components/my-goals/GoalEmptyState";
import { GoalCard } from "@/components/my-goals/GoalCard";
import { GoalDetailsModal } from "@/components/my-goals/GoalDetailsModal";
import { useGoals, useIsLoading, useAppStore, useDailyTasks } from "@/stores/appStore";
import { GoalService } from "@/services/goalService";
import { TaskService } from "@/services/taskService";
import type { Goal, GoalWithBreakdown, InsertGoal, AIBreakdownRequest, AIBreakdownResponse } from "@/lib/schema";

type View = "goals" | "wizard" | "breakdown";

function MyGoals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created");
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [goalTabs, setGoalTabs] = useState<Record<string, string>>({});
  const [currentView, setCurrentView] = useState<View>("goals");
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isTogglingTask, setIsTogglingTask] = useState(false);
  const [wizardData, setWizardData] = useState<{
    goalData: InsertGoal;
    breakdownRequest: AIBreakdownRequest;
    breakdown?: AIBreakdownResponse;
  } | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const goals = useGoals() as GoalWithBreakdown[];
  const isLoading = useIsLoading();

  // If navigated with /my-goals?goal=<id>, auto-expand that goal's details
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const goalId = params.get("goal");
      if (goalId) {
        setExpandedGoal(goalId);
      }
    } catch (_) {
      // no-op
    }
  }, []);

  // Fetch goals with detailed breakdown on component mount
  useEffect(() => {
    const fetchGoalsWithBreakdown = async () => {
      try {
        // Use GoalService for detailed goals
        await GoalService.fetchDetailedGoals();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load goals",
          variant: "destructive",
        });
      }
    };
    fetchGoalsWithBreakdown();
  }, [toast]);

  // Compute live goal progress: prefer embedded weeklyGoals.tasks; fallback to store dailyTasks
  const allDailyTasks = useDailyTasks();
  const goalProgressById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const goal of goals) {
      const wgs = (goal as any).weeklyGoals || [];
      let usedEmbedded = false;
      if (wgs.length) {
        const perWg: number[] = [];
        for (const wg of wgs) {
          const tasks = (wg as any).tasks || [];
          if (!tasks.length) continue;
          usedEmbedded = true;
          const done = tasks.filter((t: any) => t.completed).length;
          perWg.push((done / tasks.length) * 100);
        }
        if (perWg.length) {
          const avg = perWg.reduce((a, b) => a + b, 0) / perWg.length;
          map[goal.id] = Math.round(avg * 10) / 10; // 1 decimal
          continue;
        }
      }
      // Fallback to dailyTasks if no embedded data was used
      const tasks = allDailyTasks.filter(t => t.goalId === goal.id);
      if (!tasks.length) { map[goal.id] = goal.progress || 0; continue; }
      const byWg: Record<string, { total: number; done: number }> = {};
      for (const t of tasks) {
        const wgId = t.weeklyGoalId || 'ungrouped';
        if (!byWg[wgId]) byWg[wgId] = { total: 0, done: 0 };
        byWg[wgId].total += 1;
        if (t.completed) byWg[wgId].done += 1;
      }
      const groups = Object.values(byWg);
      const avg = groups.length ? (groups.reduce((acc, g) => acc + (g.total ? (g.done / g.total) * 100 : 0), 0) / groups.length) : 0;
      map[goal.id] = Math.round(avg * 10) / 10; // 1 decimal
    }
    return map;
  }, [goals, allDailyTasks]);

  // Goal actions using services - memoized to prevent unnecessary re-renders
  const handleStatusChange = useCallback(async (goalId: string, status: Goal["status"]) => {
    try {
      await GoalService.updateGoal(goalId, { status });
      toast({
        title: "Goal Updated",
        description: `Goal status changed to ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update goal status",
        variant: "destructive",
      });
      throw error; // Re-throw so optimistic update can handle rollback
    }
  }, [toast]);

  const handleDeleteGoal = useCallback(async (goalId: string) => {
    try {
      await GoalService.deleteGoal(goalId);
      toast({
        title: "Goal Deleted",
        description: "The goal has been permanently deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleTaskToggle = useCallback(async (taskId: string, completed: boolean) => {
    setIsTogglingTask(true);
    const store = useAppStore.getState();
    const prevGoalsSnapshot = store.goals;
    const prevTask = store.dailyTasks.find(t => t.id === taskId);
    const prevWeekly = prevTask ? store.weeklyGoals.find(w => w.id === prevTask.weeklyGoalId) : undefined;
    const prevGoal = prevTask ? store.goals.find(g => g.id === prevTask.goalId) : undefined;

    // Helpers to recompute progress using current store state
    const recomputeWeeklyProgress = (weeklyGoalId?: string): number => {
      if (!weeklyGoalId) return 0;
      const tasks = store.dailyTasks.filter(t => t.weeklyGoalId === weeklyGoalId);
      const total = tasks.length;
      const done = tasks.filter(t => t.completed).length;
      return total > 0 ? (done / total) * 100 : 0;
    };
    const recomputeGoalProgress = (goalId?: string): number => {
      if (!goalId) return prevGoal?.progress || 0;
      // Derive from daily tasks grouped by weeklyGoalId for this goal
      const tasks = store.dailyTasks.filter(t => t.goalId === goalId);
      if (tasks.length === 0) return 0;
      const byWg: Record<string, { total: number; done: number }> = {};
      for (const t of tasks) {
        const wgId = t.weeklyGoalId || 'ungrouped';
        if (!byWg[wgId]) byWg[wgId] = { total: 0, done: 0 };
        byWg[wgId].total += 1;
        if (t.completed) byWg[wgId].done += 1;
      }
      const groups = Object.values(byWg);
      const avg = groups.length ? (groups.reduce((acc, g) => acc + (g.total ? (g.done / g.total) * 100 : 0), 0) / groups.length) : 0;
      return Math.round(avg * 100) / 100;
    };

    // Optimistic updates: task, weekly goal, parent goal, and embedded task within goals' breakdown
    store.updateDailyTask(taskId, { completed });
    // Update embedded tasks inside goals so GoalCard progress can derive immediately
    const optimisticGoals = prevGoalsSnapshot.map((goal) => {
      const anyWgHasTask = (goal as any).weeklyGoals?.some((wg: any) => wg.tasks?.some((t: any) => t.id === taskId));
      if (!anyWgHasTask) return goal;
      const goalWithBreakdown = goal as any;
      return {
        ...goalWithBreakdown,
        weeklyGoals: goalWithBreakdown.weeklyGoals?.map((wg: any) => ({
          ...wg,
          tasks: wg.tasks?.map((t: any) => t.id === taskId ? { ...t, completed } : t) || []
        })) || []
      };
    });
    store.setGoals(optimisticGoals as any);
    if (prevTask?.weeklyGoalId) {
      const newWgProgress = recomputeWeeklyProgress(prevTask.weeklyGoalId);
      store.updateWeeklyGoal(prevTask.weeklyGoalId, { progress: newWgProgress });
    }
    if (prevTask?.goalId) {
      const newGoalProgress = recomputeGoalProgress(prevTask.goalId);
      store.updateGoal(prevTask.goalId, { progress: newGoalProgress });
    }

    try {
      await TaskService.updateTask(taskId, { completed });
      // Re-sync progress after server update
      if (prevTask?.weeklyGoalId) {
        const newWgProgress = recomputeWeeklyProgress(prevTask.weeklyGoalId);
        store.updateWeeklyGoal(prevTask.weeklyGoalId, { progress: newWgProgress });
      }
      if (prevTask?.goalId) {
        const newGoalProgress = recomputeGoalProgress(prevTask.goalId);
        store.updateGoal(prevTask.goalId, { progress: newGoalProgress });
      }
    } catch (error) {
      // Rollback on error
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
      if (prevTask) {
        store.updateDailyTask(taskId, { completed: prevTask.completed });
      }
      if (prevWeekly?.id) {
        store.updateWeeklyGoal(prevWeekly.id, { progress: prevWeekly.progress });
      }
      if (prevGoal?.id) {
        store.updateGoal(prevGoal.id, { progress: prevGoal.progress });
      }
      throw error;
    } finally {
      // Reset the flag after a short delay to allow state to settle
      setTimeout(() => setIsTogglingTask(false), 100);
    }
  }, [toast]);

  // Filter and sort goals - make sorting stable to prevent scroll jumps
  const filteredGoals = goals
    .filter((goal) => {
      const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            goal.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || goal.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // During task toggle, use completely stable sort to prevent DOM rearrangement
      if (isTogglingTask) {
        return a.id.localeCompare(b.id);
      }

      // Primary sort
      let primaryCompare = 0;
      switch (sortBy) {
        case "progress":
          primaryCompare = (b.progress || 0) - (a.progress || 0);
          break;
        case "deadline":
          primaryCompare = new Date(a.deadline || '').getTime() - new Date(b.deadline || '').getTime();
          break;
        case "title":
          primaryCompare = a.title.localeCompare(b.title);
          break;
        default: // created
          primaryCompare = new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
          break;
      }

      // If primary sort is equal, use stable sort by ID to prevent reordering
      if (primaryCompare === 0) {
        return a.id.localeCompare(b.id);
      }

      return primaryCompare;
    });

  const handleStartGoalCreation = () => {
    setEditingGoal(null);
    setCurrentView("wizard");
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setCurrentView("wizard");
  };

  // Decide default tab per goal based on data availability
  const getDefaultTabForGoal = useCallback((goal: GoalWithBreakdown): string => {
    const hasAnyTasks = goal.weeklyGoals?.some(wg => (wg as any).tasks?.length) || false;
    if (hasAnyTasks) return "tasks";
    const hasMilestones = (goal.weeklyGoals?.length || 0) > 0;
    if (hasMilestones) return "milestones";
    return "smart";
  }, []);

  // Create a toggle handler bound to a specific goal to set default tab on first open
  const makeToggleExpand = useCallback((goal: GoalWithBreakdown) => {
    return (goalId: string) => {
      const willExpand = expandedGoal !== goalId;
      setExpandedGoal(willExpand ? goalId : null);
      if (willExpand && !goalTabs[goalId]) {
        const def = getDefaultTabForGoal(goal);
        setGoalTabs(prev => ({ ...prev, [goalId]: def }));
      }
    };
  }, [expandedGoal, goalTabs, getDefaultTabForGoal]);

  const handleTabChange = (goalId: string, tabValue: string) => {
    setGoalTabs(prev => ({
      ...prev,
      [goalId]: tabValue
    }));
  };

  const handleCloseWizard = () => {
    setCurrentView("goals");
    setEditingGoal(null);
    setWizardData(null);
  };

  const handleProceedToBreakdown = (goalData: InsertGoal, breakdownRequest: AIBreakdownRequest, breakdown: AIBreakdownResponse) => {
    setWizardData({ goalData, breakdownRequest, breakdown });
    setCurrentView("breakdown");
  };

  const handleSaveComplete = async () => {
    setCurrentView("goals");
    setWizardData(null);
    // Refetch goals to show the newly created goal
    try {
      await GoalService.fetchGoals();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh goals",
        variant: "destructive",
      });
    }
  };

  if (currentView === "wizard") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navigation />
        <div className="max-w-7xl mx-auto px-3 py-4">
          <GoalWizard
            onClose={handleCloseWizard}
            onProceedToBreakdown={handleProceedToBreakdown}
            editGoal={editingGoal || undefined}
          />
        </div>
      </div>
    );
  }

  if (currentView === "breakdown" && wizardData?.breakdown) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navigation />
        <div className="max-w-7xl mx-auto px-3 py-4">
          <AIBreakdown
            goalData={wizardData.goalData}
            breakdownRequest={wizardData.breakdownRequest}
            breakdown={wizardData.breakdown}
            onSaveComplete={handleSaveComplete}
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navigation />
        <div className="max-w-7xl mx-auto px-3 py-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />

      <div className="max-w-7xl mx-auto px-3 py-3">
        <GoalHeader onCreateGoal={handleStartGoalCreation} />

        <GoalFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />

        {filteredGoals.length === 0 ? (
          <GoalEmptyState hasGoals={goals.length > 0} onCreateGoal={handleStartGoalCreation} />
        ) : (
          <div className="space-y-3">
            {filteredGoals.map((goal) => (
              <div key={goal.id}>
                <GoalCard
                  goal={goal}
                  isExpanded={expandedGoal === goal.id}
                  onToggleExpand={makeToggleExpand(goal)}
                  onEditGoal={handleEditGoal}
                  onStatusChange={handleStatusChange}
                  onDeleteGoal={handleDeleteGoal}
                  displayProgress={goalProgressById[goal.id] ?? goal.progress ?? 0}
                />
                {expandedGoal === goal.id && (
                  <GoalDetailsModal
                    goal={goal}
                    onTaskToggle={handleTaskToggle}
                    activeTab={goalTabs[goal.id] || getDefaultTabForGoal(goal)}
                    onTabChange={(tabValue: string) => handleTabChange(goal.id, tabValue)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default withErrorBoundary(MyGoals);