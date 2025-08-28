import { useEffect, useState } from "react";
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
import { useGoals, useIsLoading } from "@/stores/appStore";
import { GoalService } from "@/services/goalService";
import { TaskService } from "@/services/taskService";
import type { Goal, GoalWithBreakdown, InsertGoal, AIBreakdownRequest, AIBreakdownResponse } from "@/lib/schema";

type View = "goals" | "wizard" | "breakdown";

function MyGoals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created");
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>("goals");
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
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

  // Goal actions using services
  const handleStatusChange = async (goalId: string, status: Goal["status"]) => {
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
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
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
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      await TaskService.updateTask(taskId, { completed });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  // Filter and sort goals
  const filteredGoals = goals
    .filter((goal) => {
      const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           goal.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || goal.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "progress":
          return (b.progress || 0) - (a.progress || 0);
        case "deadline":
          return new Date(a.deadline || '').getTime() - new Date(b.deadline || '').getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default: // created
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      }
    });

  const handleStartGoalCreation = () => {
    setEditingGoal(null);
    setCurrentView("wizard");
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setCurrentView("wizard");
  };

  const handleToggleExpand = (goalId: string) => {
    setExpandedGoal(expandedGoal === goalId ? null : goalId);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
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
          <div className="space-y-4">
            {filteredGoals.map((goal) => (
              <div key={goal.id}>
                <GoalCard
                  goal={goal}
                  isExpanded={expandedGoal === goal.id}
                  onToggleExpand={handleToggleExpand}
                  onEditGoal={handleEditGoal}
                  onStatusChange={handleStatusChange}
                  onDeleteGoal={handleDeleteGoal}
                />
                {expandedGoal === goal.id && (
                  <GoalDetailsModal goal={goal} onTaskToggle={handleTaskToggle} />
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