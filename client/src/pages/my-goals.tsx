import { useEffect, useState } from "react";
import { Search, Filter, Plus, Target, Calendar, CheckCircle, Pause, Play, Edit, Trash2, MoreHorizontal, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import Navigation from "@/components/navigation";
import GoalWizard from "@/components/goal-wizard";
import AIBreakdown from "@/components/ai-breakdown";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { withErrorBoundary } from "@/components/ErrorBoundary";
import { formatDate, getDaysUntilDeadline, isOverdue } from "@/lib/dateUtils";
import { getStatusColor, getPriorityColor, getStatusDisplayText, getPriorityDisplayText } from "@/lib/goalUtils";
import { useAppStore, useGoals, useIsLoading } from "@/stores/appStore";
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
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Target className="text-secondary mr-3 h-7 w-7" />
                {t('myGoals.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{t('myGoals.trackProgress')}</p>
            </div>
            <Button onClick={handleStartGoalCreation} data-testid="button-create-new-goal">
              <Plus className="h-4 w-4 mr-2" />
              {t('myGoals.createNewGoal')}
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('myGoals.searchGoals')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-goals"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1" data-testid="select-status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('myGoals.allStatus')}</SelectItem>
                <SelectItem value="active">{t('myGoals.active')}</SelectItem>
                <SelectItem value="completed">{t('myGoals.completed')}</SelectItem>
                <SelectItem value="paused">{t('myGoals.paused')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="flex-1" data-testid="select-sort-by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">{t('myGoals.newest')}</SelectItem>
                <SelectItem value="deadline">{t('myGoals.deadline')}</SelectItem>
                <SelectItem value="progress">{t('myGoals.progress')}</SelectItem>
                <SelectItem value="title">{t('common.title')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Goals List */}
        {filteredGoals.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {goals.length === 0 ? t('myGoals.noGoalsYet') : t('myGoals.noGoalsFound')}
              </h3>
              <p className="text-gray-600 mb-6">
                {goals.length === 0 
                  ? t('myGoals.startJourney')
                  : t('myGoals.adjustSearch')}
              </p>
              {goals.length === 0 && (
                <Button onClick={handleStartGoalCreation} data-testid="button-empty-create-goal">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('myGoals.createFirstGoal')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredGoals.map((goal) => (
              <Card key={goal.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:gap-4">
                    <div className="order-1 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <CardTitle className="text-lg sm:text-xl mb-2">{goal.title}</CardTitle>
                          {goal.description && (
                            <CardDescription className="text-sm sm:text-base">{goal.description}</CardDescription>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <Badge className={getStatusColor(goal.status)}>
                              {getStatusDisplayText(goal.status)}
                            </Badge>
                            <div className={`flex items-center text-sm ${isOverdue(goal.deadline) ? 'text-red-600' : 'text-gray-600'}`}>
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(goal.deadline)}
                              {isOverdue(goal.deadline) && (
                                <Badge className="ml-2 bg-red-100 text-red-800 border-red-200">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            {goal.deadline && getDaysUntilDeadline(goal.deadline) >= 0 && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-1" />
                                {getDaysUntilDeadline(goal.deadline)} {t('myGoals.daysLeft')}
                              </div>
                            )}
                            {goal.deadline && isOverdue(goal.deadline) && (
                              <div className="flex items-center text-sm text-red-600">
                                <Clock className="h-4 w-4 mr-1" />
                                {Math.abs(getDaysUntilDeadline(goal.deadline))} days overdue
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="order-3 sm:order-2 flex flex-row justify-between sm:flex-row-reverse sm:justify-end items-start gap-2 w-full">
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{goal.progress || 0}%</div>
                        <Progress value={goal.progress || 0} className="w-full sm:w-20" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="self-start sm:self-start shrink-0" data-testid={`button-goal-menu-${goal.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
                            data-testid={`menu-view-details-${goal.id}`}
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleEditGoal(goal)}
                            data-testid={`menu-edit-${goal.id}`}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Goal
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {goal.status === "active" && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(goal.id, "paused")}
                              data-testid={`menu-pause-${goal.id}`}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Pause Goal
                            </DropdownMenuItem>
                          )}
                          {goal.status === "paused" && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(goal.id, "active")}
                              data-testid={`menu-resume-${goal.id}`}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Resume Goal
                            </DropdownMenuItem>
                          )}
                          {goal.status !== "completed" && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(goal.id, "completed")}
                              data-testid={`menu-complete-${goal.id}`}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="text-red-600"
                            data-testid={`menu-delete-${goal.id}`}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Goal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded Goal Details */}
                {expandedGoal === goal.id && (
                  <CardContent className="border-t pt-6">
                    <Tabs defaultValue="smart" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="smart">SMART(ER)</TabsTrigger>
                        <TabsTrigger value="milestones">Milestones</TabsTrigger>
                        <TabsTrigger value="tasks">Tasks</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="smart" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-sm text-gray-700 mb-1">Specific</h4>
                            <p className="text-sm text-gray-600">{goal.specific}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-gray-700 mb-1">Measurable</h4>
                            <p className="text-sm text-gray-600">{goal.measurable}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-gray-700 mb-1">Achievable</h4>
                            <p className="text-sm text-gray-600">{goal.achievable}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-gray-700 mb-1">Relevant</h4>
                            <p className="text-sm text-gray-600">{goal.relevant}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-gray-700 mb-1">Time-bound</h4>
                            <p className="text-sm text-gray-600">{goal.timebound}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-gray-700 mb-1">Exciting</h4>
                            <p className="text-sm text-gray-600">{goal.exciting}</p>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="milestones" className="space-y-4">
                        {goal.weeklyGoals?.length ? (
                          <div className="space-y-3">
                            {goal.weeklyGoals.map((weeklyGoal) => (
                              <div key={weeklyGoal.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold">{weeklyGoal.title}</h4>
                                  <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(weeklyGoal.status)}>
                                      {getStatusDisplayText(weeklyGoal.status)}
                                    </Badge>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                      {weeklyGoal.progress || 0}%
                                    </div>
                                  </div>
                                </div>
                                {weeklyGoal.description && (
                                  <p className="text-sm text-gray-600 mb-2">{weeklyGoal.description}</p>
                                )}
                                <div className="text-xs text-gray-500">
                                  Week {weeklyGoal.weekNumber}: {formatDate(weeklyGoal.startDate)} - {formatDate(weeklyGoal.endDate)}
                                </div>
                                <Progress value={weeklyGoal.progress || 0} className="mt-2" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 py-8">No milestones available</p>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="tasks" className="space-y-4">
                        {goal.weeklyGoals?.some(wg => wg.tasks?.length) ? (
                          <div className="space-y-4">
                            {goal.weeklyGoals.map((weeklyGoal) => (
                              weeklyGoal.tasks?.length ? (
                                <div key={weeklyGoal.id}>
                                  <h4 className="font-semibold mb-3">{weeklyGoal.title}</h4>
                                  <div className="space-y-2">
                                    {weeklyGoal.tasks.map((task) => (
                                      <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                        <input
                                          type="checkbox"
                                          checked={task.completed || false}
                                          onChange={(e) => handleTaskToggle(task.id, e.target.checked)}
                                          className="rounded"
                                          data-testid={`task-checkbox-${task.id}`}
                                        />
                                        <div className="flex-1">
                                          <div className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                            {task.title}
                                          </div>
                                          {task.description && (
                                            <div className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                                              {task.description}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge className={getPriorityColor(task.priority)}>
                                            {getPriorityDisplayText(task.priority)}
                                          </Badge>
                                          <div className="text-xs text-gray-500">
                                            {task.estimatedHours || 1}h
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 py-8">No tasks available</p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default withErrorBoundary(MyGoals);