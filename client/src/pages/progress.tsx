import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/i18n';
import Navigation from "@/components/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { withErrorBoundary } from "@/components/ErrorBoundary";
import { ProgressHeader } from "@/components/progress/ProgressHeader";
import { MotivationalCard } from "@/components/progress/MotivationalCard";
import { ProgressMetricsGrid } from "@/components/progress/ProgressMetricsGrid";
import { WeeklyProgressTab } from "@/components/progress/WeeklyProgressTab";
import { AchievementsTab } from "@/components/progress/AchievementsTab";
import { TimelineTab } from "@/components/progress/TimelineTab";
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
        <ProgressHeader />
        <MotivationalCard getMotivationalMessage={getMotivationalMessage} />

        <ProgressMetricsGrid progressStats={progressStats} weeklyCompletedTasks={weeklyCompletedTasks} />

        <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">{t('common.thisWeek')}</TabsTrigger>
            <TabsTrigger value="achievements">{t('progressPage.achievements')}</TabsTrigger>
            <TabsTrigger value="timeline">{t('progressPage.timeline')}</TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="space-y-6">
            <WeeklyProgressTab
              currentWeekProgress={currentWeekProgress}
              weeklyCompletedTasks={weeklyCompletedTasks}
              weeklyTotalTasks={weeklyTotalTasks}
              getDaysOfWeek={getDaysOfWeek}
              currentWeekTasks={currentWeekTasks}
              handleTaskToggle={handleTaskToggle}
            />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <AchievementsTab achievements={achievements} />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <TimelineTab goals={goals} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default withErrorBoundary(Progress);