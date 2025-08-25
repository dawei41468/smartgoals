import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Target, CheckSquare, TrendingUp, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/navigation";
import GoalWizard from "@/components/goal-wizard";
import AIBreakdown from "@/components/ai-breakdown";
import { api } from "@/lib/api";
import type { InsertGoal, AIBreakdownRequest, AIBreakdownResponse } from "@shared/schema";

type View = "dashboard" | "wizard" | "breakdown";

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [wizardData, setWizardData] = useState<{
    goalData: InsertGoal;
    breakdownRequest: AIBreakdownRequest;
    breakdown?: AIBreakdownResponse;
  } | null>(null);

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["/api/goals"],
    queryFn: () => api.getGoals(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
    queryFn: () => api.getStats(),
  });

  const handleStartGoalCreation = () => {
    setCurrentView("wizard");
  };

  const handleCloseWizard = () => {
    setCurrentView("dashboard");
    setWizardData(null);
  };

  const handleProceedToBreakdown = async (goalData: InsertGoal, breakdownRequest: AIBreakdownRequest) => {
    try {
      const breakdown = await api.generateBreakdown(breakdownRequest);
      setWizardData({ goalData, breakdownRequest, breakdown });
      setCurrentView("breakdown");
    } catch (error) {
      console.error("Failed to generate breakdown:", error);
    }
  };

  const handleSaveComplete = () => {
    setCurrentView("dashboard");
    setWizardData(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const getSmarterTags = () => [
    { label: "Specific", color: "bg-primary/10 text-primary" },
    { label: "Measurable", color: "bg-secondary/10 text-secondary" },
    { label: "Achievable", color: "bg-accent/10 text-accent" },
    { label: "Relevant", color: "bg-purple-100 text-purple-700" },
    { label: "Time-bound", color: "bg-pink-100 text-pink-700" },
  ];

  if (currentView === "wizard") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <GoalWizard onClose={handleCloseWizard} onProceedToBreakdown={handleProceedToBreakdown} />
        </div>
      </div>
    );
  }

  if (currentView === "breakdown" && wizardData?.breakdown) {
    return (
      <div className="min-h-screen bg-gray-50">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 sm:p-8 text-white">
            <div className="max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Transform Your Goals into Actionable Plans</h1>
              <p className="text-primary-foreground/90 mb-4 sm:mb-6 text-sm sm:text-base">
                Use the SMART(ER) framework to create meaningful goals and let AI break them down into daily tasks.
              </p>
              <Button 
                onClick={handleStartGoalCreation}
                className="bg-white text-primary hover:bg-gray-50 w-full sm:w-auto"
                data-testid="button-create-goal"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Goal
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Target className="gradient-icon h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Active Goals</p>
                    <p className="text-xl sm:text-2xl font-bold" data-testid="stat-active-goals">
                      {statsLoading ? "..." : stats?.activeGoalsCount || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <CheckSquare className="text-accent h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
                    <p className="text-xl sm:text-2xl font-bold" data-testid="stat-completed-tasks">
                      {statsLoading ? "..." : stats?.completedTasksCount || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="text-primary h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-xl sm:text-2xl font-bold" data-testid="stat-success-rate">
                      {statsLoading ? "..." : `${stats?.successRate || 0}%`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Goals */}
          <Card>
            <div className="p-4 sm:p-6 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                <h2 className="text-lg sm:text-xl font-bold">Your Active Goals</h2>
                <Button variant="ghost" size="sm" className="self-start sm:self-auto" data-testid="button-view-all-goals">
                  <span className="hidden sm:inline">View All Goals</span>
                  <span className="sm:hidden">View All</span>
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {goalsLoading ? (
              <div className="p-6">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </div>
            ) : goals.length === 0 ? (
              <div className="p-4 sm:p-6">
                <div className="text-center py-6 sm:py-8">
                  <Target className="mx-auto h-10 w-10 sm:h-12 sm:w-12 gradient-icon mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No goals yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    Create your first SMART(ER) goal to get started on your journey to success.
                  </p>
                  <Button onClick={handleStartGoalCreation} className="w-full sm:w-auto" data-testid="button-create-first-goal">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Goal
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {goals.map((goal) => (
                  <div key={goal.id} className="p-6 border-b border-border last:border-b-0" data-testid={`goal-${goal.id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2" data-testid={`text-goal-title-${goal.id}`}>
                          {goal.title}
                        </h3>
                        <p className="text-muted-foreground mb-4" data-testid={`text-goal-description-${goal.id}`}>
                          {goal.description}
                        </p>
                        
                        {/* SMART(ER) Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {getSmarterTags().map((tag) => (
                            <span key={tag.label} className={`px-2 py-1 text-xs font-medium rounded ${tag.color}`}>
                              {tag.label}
                            </span>
                          ))}
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span data-testid={`text-goal-progress-${goal.id}`}>{goal.progress}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all" 
                              style={{ width: `${goal.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Next Task Placeholder */}
                        <div className="text-sm">
                          <span className="text-muted-foreground">Status: </span>
                          <span className="font-medium capitalize" data-testid={`text-goal-status-${goal.id}`}>
                            {goal.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="ml-6 flex flex-col items-end space-y-2">
                        <span className="text-sm text-muted-foreground" data-testid={`text-goal-deadline-${goal.id}`}>
                          Due: {formatDate(goal.deadline)}
                        </span>
                        <Button variant="ghost" size="sm" data-testid={`button-view-goal-${goal.id}`}>
                          View Details <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className="p-4 sm:p-6 border-b border-border">
              <h2 className="text-lg sm:text-xl font-bold">Recent Activity</h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-secondary rounded-full flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-muted-foreground">Welcome to SMART Goals! Create your first goal to see activity here.</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="inline h-3 w-3 mr-1" />
                    Just now
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={handleStartGoalCreation}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg z-50"
        size="icon"
        data-testid="button-fab-create-goal"
      >
        <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    </div>
  );
}
