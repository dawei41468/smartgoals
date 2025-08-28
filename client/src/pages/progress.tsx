import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
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
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/i18n';
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { withErrorBoundary } from "@/components/ErrorBoundary";
import { getStatusDisplayText, getPriorityDisplayText, getStatusColor, getPriorityColor } from "@/lib/goalUtils";
import { formatDate } from "@/lib/dateUtils";
import { useGoals, useIsLoading, useProgressStats, useAchievements } from "@/stores/appStore";
import { GoalService } from "@/services/goalService";
import { TaskService } from "@/services/taskService";
import { ProgressService } from "@/services/progressService";
import type { GoalWithBreakdown } from "@/lib/schema";


function Progress() {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const goals = useGoals() as GoalWithBreakdown[];
  const isLoading = useIsLoading();
  const progressStats = useProgressStats();
  const achievements = useAchievements();

  // Fetch all progress data on component mount
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        // Fetch goals with breakdown using service
        await GoalService.fetchDetailedGoals();
        
        // Fetch all progress data using service
        await ProgressService.fetchAllProgressData();
        
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load progress data",
          variant: "destructive",
        });
      }
    };
    
    fetchProgressData();
  }, [toast]);

  // Use progress stats from API or calculate from goals data as fallback
  const safeStats = progressStats || {
    totalGoals: goals.length,
    completedGoals: goals.filter(g => g.status === 'completed').length,
    activeGoals: goals.filter(g => g.status === 'active').length,
    totalTasks: goals.flatMap(g => g.weeklyGoals?.flatMap(wg => wg.tasks || []) || []).length,
    completedTasks: goals.flatMap(g => g.weeklyGoals?.flatMap(wg => wg.tasks || []) || []).filter(t => t.completed).length,
    currentStreak: 0,
    longestStreak: 0,
    thisWeekProgress: 0,
    avgCompletionTime: 0
  };

  // Use achievements from store or generate mock ones as fallback
  const displayAchievements = achievements.length > 0 ? achievements : ProgressService.generateMockAchievements(safeStats);

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
  const weeklyCompletedTasks = currentWeekTasks.filter(t => t.completed).length;
  const weeklyTotalTasks = currentWeekTasks.length;
  const currentWeekProgress = weeklyTotalTasks > 0 ? Math.round((weeklyCompletedTasks / weeklyTotalTasks) * 100) : 0;

  // Update task completion using service layer
  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      await TaskService.updateTask(taskId, { completed });
      toast({
        title: "Task Updated",
        description: "Task completion status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const getMotivationalMessage = (currentLanguage: string) => {
    // Get quotes array from i18n translations by accessing the translations object directly
    const quotes = translations[currentLanguage as keyof typeof translations].progressPage.quotes;

    // Get day of year (1-365) to use as seed for consistent daily quote
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Use day of year to select consistent daily quote
    return quotes[dayOfYear % quotes.length];
  };

  const getDaysOfWeek = () => {
    const dayKeys = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday'
    ] as const;
    const days = dayKeys.map(k => t(`progressPage.daysOfWeek.${k}`));
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
        key: dayKeys[index],
        name: day,
        date,
        tasks: dayTasks,
        completed: dayTasks.filter(t => t.completed).length,
        total: dayTasks.length,
        isToday: date.toDateString() === new Date().toDateString(),
      };
    });
  };

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
                <p className="text-primary-foreground/90">{getMotivationalMessage(language)}</p>
              </div>
              <Zap className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500 mr-1 sm:mr-2" />
                <div className="text-2xl font-bold">{safeStats?.avgCompletionTime || 0}</div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">{t('analytics.streakDays')}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t('progressPage.daysInRow')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mr-1 sm:mr-2" />
                <div className="text-2xl font-bold">{weeklyCompletedTasks}</div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">{t('common.thisWeek')}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t('progressPage.tasksCompleted')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mr-1 sm:mr-2" />
                <span className="text-xl sm:text-2xl font-bold">{safeStats?.completedGoals || 0}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">{t('progressPage.goalsAchieved')}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t('progressPage.totalCompleted')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 mr-1 sm:mr-2" />
                <span className="text-xl sm:text-2xl font-bold">{safeStats?.avgCompletionTime || 0}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">{t('analytics.avgCompletionTime')}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t('progressPage.daysPerGoal')}</p>
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
                  {t('progressPage.weeklyProgress')}
                </CardTitle>
                <CardDescription>
                  {t('progressPage.completeDailyTasks')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressBar value={currentWeekProgress} className="w-full" />
                <div className="text-sm text-gray-600 mt-2">
                  {weeklyCompletedTasks} of {weeklyTotalTasks} tasks completed
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-4">
                  {getDaysOfWeek().map((day, index) => (
                    <div
                      key={index}
                      className={`p-1.5 sm:p-3 rounded-lg border text-center ${
                        day.isToday
                          ? 'border-primary bg-primary/5'
                          : day.completed === day.total && day.total > 0
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="text-[10px] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                        {t(`progressPage.daysOfWeekShort.${day.key}`)}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{day.date.getDate()}</div>
                      {day.total > 0 && (
                        <div className="mt-1 sm:mt-2">
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full mx-auto flex items-center justify-center text-[9px] sm:text-xs ${
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
                  <CardTitle>{t('progressPage.todaysTasks')}</CardTitle>
                  <CardDescription>{t('progressPage.todaysTasksSubtitle')}</CardDescription>
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
                            onClick={() => handleTaskToggle(task.id, !task.completed)}
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
                            {getPriorityDisplayText(task.priority)}
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
                  {t('progressPage.achievementsTitle')}
                </CardTitle>
                <CardDescription>
                  {t('progressPage.achievementsSubtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayAchievements.map((achievement) => (
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
                          <Badge className={`mt-2 ${getPriorityColor('medium')}`}>
                            <Star className="w-3 h-3 mr-1" />
                            {t('progressPage.unlocked')}
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
                          <Badge variant="secondary" className="mt-2">{t('progressPage.locked')}</Badge>
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
                <CardTitle>{t('progressPage.timelineTitle')}</CardTitle>
                <CardDescription>{t('progressPage.timelineSubtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                {goals.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('myGoals.noGoalsYet')}</h3>
                    <p className="text-gray-600 mb-4">{t('myGoals.startJourney')}</p>
                    <Link href="/">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('myGoals.createFirstGoal')}
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
                                {getStatusDisplayText(goal.status)}
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

export default withErrorBoundary(Progress);