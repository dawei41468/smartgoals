import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import Navigation from "@/components/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { withErrorBoundary } from "@/components/ErrorBoundary";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { AnalyticsMetricsGrid } from "@/components/analytics/AnalyticsMetricsGrid";
import { AnalyticsOverviewTab } from "@/components/analytics/AnalyticsOverviewTab";
import { AnalyticsPatternsTab } from "@/components/analytics/AnalyticsPatternsTab";
import { AnalyticsCategoriesTab } from "@/components/analytics/AnalyticsCategoriesTab";
import { AnalyticsInsightsTab } from "@/components/analytics/AnalyticsInsightsTab";
import { useIsLoading, useAnalyticsSummary, useCategoryPerformance, useProductivityPatterns } from "@/stores/appStore";
import { StatsService } from "@/services/statsService";
import { GoalService } from "@/services/goalService";


interface Insight {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  actionable: boolean;
}

function Analytics() {
  const [timePeriod, setTimePeriod] = useState("month");
  const { t } = useLanguage();
  const { toast } = useToast();
  const isLoading = useIsLoading();
  const analyticsData = useAnalyticsSummary();
  const goalCategories = useCategoryPerformance();
  const productivityPatterns = useProductivityPatterns();

  // Fetch all analytics data on component mount
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        // Fetch goals with breakdown using service
        await GoalService.fetchDetailedGoals();
        
        // Fetch all analytics data using enhanced service
        await StatsService.fetchAllAnalyticsData();
        
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        });
      }
    };
    
    fetchAnalyticsData();
  }, [toast]);

  // Provide fallback data for analytics when data is null
  const fallbackAnalyticsData = {
    goalSuccessRate: 0,
    avgCompletionTime: 0,
    totalGoalsCreated: 0,
    completedGoals: 0,
    activeGoals: 0,
    pausedGoals: 0,
    totalTasksCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    bestPerformingDay: "Monday",
    mostProductiveHour: 10,
    weeklyProgressTrend: [0, 0, 0, 0, 0, 0, 0],
    monthlyComparison: { thisMonth: 0, lastMonth: 0, change: 0 }
  };


  // Mock insights data (keep for now)
  const insights: Insight[] = [
    {
      type: 'success',
      title: 'Strong Learning Goal Performance',
      description: 'You have a 90% success rate with learning goals. Consider applying similar strategies to other goal types.',
      actionable: true,
    },
    {
      type: 'warning',
      title: 'Weekend Productivity Dip',
      description: 'Your task completion rate drops 25% on weekends. Schedule lighter tasks or build better weekend habits.',
      actionable: true,
    },
    {
      type: 'info',
      title: 'Optimal Timing Identified',
      description: 'You perform best at 10 AM on Tuesdays. Schedule important tasks during this peak time.',
      actionable: true,
    },
    {
      type: 'success',
      title: 'Consistent Growth',
      description: 'Your monthly goal completion has increased by 50% compared to last month.',
      actionable: false,
    },
  ];


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

  // Provide fallback values if data is still undefined
  const safeAnalyticsData = {
    ...fallbackAnalyticsData,
    ...analyticsData,
    completionRate: analyticsData?.goalSuccessRate ?? fallbackAnalyticsData.goalSuccessRate
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <AnalyticsHeader timePeriod={timePeriod} onTimePeriodChange={setTimePeriod} />
        
        <AnalyticsMetricsGrid analyticsData={safeAnalyticsData} />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('analytics.overview')}</TabsTrigger>
            <TabsTrigger value="patterns">{t('analytics.patterns')}</TabsTrigger>
            <TabsTrigger value="categories">{t('analytics.categories')}</TabsTrigger>
            <TabsTrigger value="insights">{t('analytics.insights')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AnalyticsOverviewTab analyticsData={safeAnalyticsData} />
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            <AnalyticsPatternsTab analyticsData={safeAnalyticsData} productivityPatterns={productivityPatterns} />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <AnalyticsCategoriesTab goalCategories={goalCategories} />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <AnalyticsInsightsTab insights={insights} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default withErrorBoundary(Analytics);