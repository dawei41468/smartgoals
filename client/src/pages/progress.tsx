import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Calendar, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  Clock, 
  Flame, 
  Award, 
  Zap,
  ArrowRight,
  Plus,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import type { Goal, GoalWithBreakdown, WeeklyGoal, DailyTask } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ProgressStats {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  totalTasks: number;
  completedTasks: number;
  currentStreak: number;
  longestStreak: number;
  thisWeekProgress: number;
  avgCompletionTime: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export default function Progress() {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Fetch goals with detailed breakdown
  const { data: goals = [], isLoading: goalsLoading } = useQuery<GoalWithBreakdown[]>({
    queryKey: ["/api/goals/detailed"],
  });

  // Fetch progress statistics
  const { data: stats, isLoading: statsLoading } = useQuery<ProgressStats>({
    queryKey: ["/api/progress/stats"],
    queryFn: async () => {
      // Mock data for now - would be replaced with actual API
      return {
        totalGoals: goals.length,
        completedGoals: goals.filter(g => g.status === "completed").length,
        activeGoals: goals.filter(g => g.status === "active").length,
        totalTasks: goals.reduce((acc, goal) => acc + (goal.weeklyGoals?.reduce((weekAcc, week) => weekAcc + (week.tasks?.length || 0), 0) || 0), 0),
        completedTasks: goals.reduce((acc, goal) => acc + (goal.weeklyGoals?.reduce((weekAcc, week) => weekAcc + (week.tasks?.filter(t => t.completed).length || 0), 0) || 0), 0),
        currentStreak: 7,
        longestStreak: 14,
        thisWeekProgress: 68,
        avgCompletionTime: 21,
      };
    },
  });

  // Mock achievements data
  const achievements: Achievement[] = [
    {
      id: "first-goal",
      title: "Goal Setter",
      description: "Created your first SMART goal",
      icon: "🎯",
      unlockedAt: goals.length > 0 ? new Date().toISOString() : undefined,
    },
    {
      id: "week-warrior",
      title: "Week Warrior",
      description: "Complete all tasks for a full week",
      icon: "⚡",
      progress: stats?.currentStreak || 0,
      target: 7,
    },
    {
      id: "goal-achiever",
      title: "Goal Achiever",
      description: "Complete your first goal",
      icon: "🏆",
      unlockedAt: stats?.completedGoals && stats.completedGoals > 0 ? new Date().toISOString() : undefined,
    },
    {
      id: "consistency-king",
      title: "Consistency King",
      description: "Maintain a 14-day streak",
      icon: "🔥",
      progress: stats?.currentStreak || 0,
      target: 14,
      unlockedAt: stats?.longestStreak && stats.longestStreak >= 14 ? new Date().toISOString() : undefined,
    },
    {
      id: "productive-month",
      title: "Productive Month",
      description: "Complete 50 tasks in a month",
      icon: "💫",
      progress: stats?.completedTasks || 0,
      target: 50,
    },
  ];

  // Get current week's tasks
  const getCurrentWeekTasks = () => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    return goals.flatMap(goal => 
      goal.weeklyGoals?.flatMap(week => 
        week.tasks?.filter(task => {
          const taskDate = new Date(task.date || '');
          return taskDate >= startOfWeek && taskDate <= endOfWeek;
        }) || []
      ) || []
    );
  };

  const currentWeekTasks = getCurrentWeekTasks();
  const completedThisWeek = currentWeekTasks.filter(t => t.completed).length;
  const totalThisWeek = currentWeekTasks.length;
  const weekProgress = totalThisWeek > 0 ? Math.round((completedThisWeek / totalThisWeek) * 100) : 0;

  // Update task completion
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${taskId}`, { completed });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals/detailed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/stats"] });
      toast({
        title: "Task Updated",
        description: "Task status updated successfully.",
      });
    },
  });

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    updateTaskMutation.mutate({ taskId, completed });
  };

  const getMotivationalMessage = () => {
    const messages = [
      t('progressPage.motivationalMessages.everyStep'),
      t('progressPage.motivationalMessages.progressNotPerfection'),
      t('progressPage.motivationalMessages.futureself'),
      t('progressPage.motivationalMessages.consistency'),
      t('progressPage.motivationalMessages.smallImprovements'),
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysOfWeek = () => {
    const days = [
      t('progressPage.daysOfWeek.sunday'),
      t('progressPage.daysOfWeek.monday'), 
      t('progressPage.daysOfWeek.tuesday'),
      t('progressPage.daysOfWeek.wednesday'),
      t('progressPage.daysOfWeek.thursday'),
      t('progressPage.daysOfWeek.friday'),
      t('progressPage.daysOfWeek.saturday')
    ];
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    
    return days.map((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      const dayTasks = currentWeekTasks.filter(task => {
        const taskDate = new Date(task.date || '');
        return taskDate.toDateString() === date.toDateString();
      });
      
      return {
        name: day,
        date,
        tasks: dayTasks,
        completed: dayTasks.filter(t => t.completed).length,
        total: dayTasks.length,
        isToday: date.toDateString() === new Date().toDateString(),
      };
    });
  };

  if (goalsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="text-secondary mr-3 h-7 w-7" />
            {t('progressPage.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{t('progressPage.description')}</p>
        </div>

        {/* Motivational Message */}
        <Card className="mb-6 bg-gradient-to-r from-primary to-secondary text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('progressPage.dailyMotivation')}</h3>
                <p className="text-primary-foreground/90">{getMotivationalMessage()}</p>
              </div>
              <Zap className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="h-6 w-6 text-orange-500 mr-2" />
                <span className="text-2xl font-bold">{stats?.currentStreak || 0}</span>
              </div>
              <p className="text-sm text-gray-600">{t('analytics.streakDays')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('progressPage.daysInRow')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                <span className="text-2xl font-bold">{completedThisWeek}</span>
              </div>
              <p className="text-sm text-gray-600">{t('common.thisWeek')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('progressPage.tasksCompleted')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-6 w-6 text-blue-500 mr-2" />
                <span className="text-2xl font-bold">{stats?.completedGoals || 0}</span>
              </div>
              <p className="text-sm text-gray-600">{t('progressPage.goalsAchieved')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('progressPage.totalCompleted')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 text-purple-500 mr-2" />
                <span className="text-2xl font-bold">{stats?.avgCompletionTime || 0}</span>
              </div>
              <p className="text-sm text-gray-600">{t('analytics.avgCompletionTime')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('progressPage.daysPerGoal')}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">{t('common.thisWeek')}</TabsTrigger>
            <TabsTrigger value="achievements">{t('progressPage.achievements')}</TabsTrigger>
            <TabsTrigger value="timeline">{t('progressPage.timeline')}</TabsTrigger>
          </TabsList>

          {/* This Week Tab */}
          <TabsContent value="week" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Weekly Progress
                </CardTitle>
                <CardDescription>
                  Complete your daily tasks to maintain your streak
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Weekly Progress</span>
                    <span>{weekProgress}%</span>
                  </div>
                  <ProgressBar value={weekProgress} className="h-3" />
                  <p className="text-xs text-gray-500 mt-1">
                    {completedThisWeek} of {totalThisWeek} tasks completed
                  </p>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {getDaysOfWeek().map((day, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border text-center ${
                        day.isToday
                          ? 'border-primary bg-primary/5'
                          : day.completed === day.total && day.total > 0
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-700">{day.name.slice(0, 3)}</div>
                      <div className="text-xs text-gray-500 mt-1">{day.date.getDate()}</div>
                      {day.total > 0 && (
                        <div className="mt-2">
                          <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs ${
                            day.completed === day.total
                              ? 'bg-green-500 text-white'
                              : day.completed > 0
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {day.completed}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Today's Tasks */}
            {currentWeekTasks.filter(task => {
              const taskDate = new Date(task.date || '');
              return taskDate.toDateString() === new Date().toDateString();
            }).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Today's Tasks</CardTitle>
                  <CardDescription>Focus on these tasks to maintain your progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentWeekTasks
                      .filter(task => {
                        const taskDate = new Date(task.date || '');
                        return taskDate.toDateString() === new Date().toDateString();
                      })
                      .map((task) => (
                        <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <input
                            type="checkbox"
                            checked={task.completed || false}
                            onChange={(e) => handleTaskToggle(task.id, e.target.checked)}
                            className="rounded"
                            data-testid={`today-task-${task.id}`}
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
                          <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                            {task.priority}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  Your Achievements
                </CardTitle>
                <CardDescription>
                  Unlock badges by reaching milestones and maintaining good habits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border ${
                        achievement.unlockedAt
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`text-4xl mb-2 ${achievement.unlockedAt ? '' : 'grayscale opacity-50'}`}>
                          {achievement.icon}
                        </div>
                        <h3 className="font-semibold text-sm">{achievement.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
                        
                        {achievement.unlockedAt ? (
                          <Badge className="mt-2 bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Unlocked
                          </Badge>
                        ) : achievement.target && achievement.progress !== undefined ? (
                          <div className="mt-2">
                            <ProgressBar 
                              value={(achievement.progress / achievement.target) * 100} 
                              className="h-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {achievement.progress} / {achievement.target}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="mt-2">Locked</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress Timeline</CardTitle>
                <CardDescription>A visual journey of your goal achievements</CardDescription>
              </CardHeader>
              <CardContent>
                {goals.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Goals Yet</h3>
                    <p className="text-gray-600 mb-4">Start your journey by creating your first goal</p>
                    <Link href="/">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Goal
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals
                      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
                      .map((goal, index) => (
                        <div key={goal.id} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              goal.status === 'completed' 
                                ? 'bg-green-500 text-white' 
                                : goal.status === 'active'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {goal.status === 'completed' ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Target className="h-4 w-4" />
                              )}
                            </div>
                            {index < goals.length - 1 && (
                              <div className="w-px h-16 bg-gray-200 mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold">{goal.title}</h3>
                              <span className="text-sm text-gray-500">
                                {formatDate(goal.createdAt?.toString() || '')}
                              </span>
                            </div>
                            {goal.description && (
                              <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'}>
                                {goal.status}
                              </Badge>
                              <span className="text-sm text-gray-500">{goal.progress || 0}% complete</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}