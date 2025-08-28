import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Target, 
  CheckCircle, 
  AlertCircle,
  Brain,
  Lightbulb,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Folder
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import Navigation from "@/components/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { withErrorBoundary } from "@/components/ErrorBoundary";
import { useAppStore, useGoals, useStats, useIsLoading } from "@/stores/appStore";
import { StatsService } from "@/services/statsService";
import { GoalService } from "@/services/goalService";
import { apiRequest } from "@/lib/queryClient";
import type { Goal, GoalWithBreakdown } from "@/lib/schema";

interface AnalyticsData {
  goalSuccessRate: number;
  avgCompletionTime: number;
  totalGoalsCreated: number;
  completedGoals: number;
  activeGoals: number;
  pausedGoals: number;
  totalTasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  bestPerformingDay: string;
  mostProductiveHour: number;
  weeklyProgressTrend: number[];
  monthlyComparison: {
    thisMonth: number;
    lastMonth: number;
    change: number;
  };
}

interface GoalCategory {
  name: string;
  count: number;
  successRate: number;
  avgTimeToComplete: number;
}

interface ProductivityPattern {
  dayOfWeek: string;
  completionRate: number;
  tasksCompleted: number;
}

interface Insight {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  actionable: boolean;
}

function Analytics() {
  const [timePeriod, setTimePeriod] = useState("month");
  const [selectedMetric, setSelectedMetric] = useState("completion_rate");
  const { t } = useLanguage();
  const { toast } = useToast();
  const goals = useGoals() as GoalWithBreakdown[];
  const stats = useStats();
  const isLoading = useIsLoading();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [goalCategories, setGoalCategories] = useState<GoalCategory[]>([]);
  const [productivityPatterns, setProductivityPatterns] = useState<ProductivityPattern[]>([]);

  // Fetch all analytics data on component mount
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        useAppStore.getState().setLoading(true);
        
        // Fetch goals with breakdown
        const goalsResponse = await apiRequest("GET", "/api/goals/detailed");
        const goalsData = await goalsResponse.json();
        useAppStore.getState().setGoals(goalsData);
        
        // Fetch analytics summary
        const analyticsResponse = await apiRequest("GET", "/api/analytics/summary");
        const analytics = await analyticsResponse.json();
        setAnalyticsData(analytics);
        
        // Fetch category performance
        const categoriesResponse = await apiRequest("GET", "/api/analytics/categories");
        const categories = await categoriesResponse.json();
        setGoalCategories(categories);
        
        // Fetch productivity patterns
        const patternsResponse = await apiRequest("GET", "/api/analytics/patterns");
        const patterns = await patternsResponse.json();
        setProductivityPatterns(patterns);
        
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        });
      } finally {
        useAppStore.getState().setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [toast]);

  // Provide fallback data for analytics when API fails
  const fallbackAnalyticsData: AnalyticsData = {
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

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
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

  // Provide fallback values if data is still undefined
  const safeAnalyticsData = analyticsData || fallbackAnalyticsData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="text-secondary mr-3 h-7 w-7" />
                {t('analytics.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{t('analytics.description')}</p>
            </div>
            <div className="flex gap-2">
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="min-w-fit" data-testid="select-time-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">{t('common.thisWeek')}</SelectItem>
                  <SelectItem value="month">{t('common.thisMonth')}</SelectItem>
                  <SelectItem value="quarter">{t('analytics.thisQuarter')}</SelectItem>
                  <SelectItem value="year">{t('analytics.thisYear')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">{t('dashboard.successRate')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{safeAnalyticsData.goalSuccessRate}%</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center">
                {safeAnalyticsData.monthlyComparison.change > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-xs sm:text-sm ${safeAnalyticsData.monthlyComparison.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(safeAnalyticsData.monthlyComparison.change)}% {t('analytics.vsLastMonth')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">{t('analytics.avgCompletionTime')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{safeAnalyticsData.avgCompletionTime} days</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">{t('analytics.timeToComplete')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">{t('analytics.streakDays')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">{safeAnalyticsData.currentStreak} days</p>
                </div>
                <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">{t('analytics.personalBest')}: {safeAnalyticsData.longestStreak} {t('analytics.days')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">{t('dashboard.tasksCompleted')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">{safeAnalyticsData.totalTasksCompleted}</p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">{t('analytics.acrossAllGoals')}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('analytics.overview')}</TabsTrigger>
            <TabsTrigger value="patterns">{t('analytics.patterns')}</TabsTrigger>
            <TabsTrigger value="categories">{t('analytics.categories')}</TabsTrigger>
            <TabsTrigger value="insights">{t('analytics.insights')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    {t('analytics.weeklyProgressTrend')}
                  </CardTitle>
                  <CardDescription>{t('analytics.taskCompletionRate')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {safeAnalyticsData.weeklyProgressTrend.map((progress, index) => {
                      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-10">{days[index]}</span>
                          <ProgressBar value={progress} className="flex-1" />
                          <span className="text-sm text-gray-600 w-12">{progress}%</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="mr-2 h-5 w-5" />
                    {t('analytics.goalStatusDistribution')}
                  </CardTitle>
                  <CardDescription>{t('analytics.currentStatusGoals')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">{t('myGoals.completed')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{safeAnalyticsData.completedGoals}</span>
                        <span className="text-xs text-gray-500">
                          ({safeAnalyticsData.totalGoalsCreated > 0 ? Math.round((safeAnalyticsData.completedGoals / safeAnalyticsData.totalGoalsCreated) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">{t('myGoals.active')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{safeAnalyticsData.activeGoals}</span>
                        <span className="text-xs text-gray-500">
                          ({safeAnalyticsData.totalGoalsCreated > 0 ? Math.round((safeAnalyticsData.activeGoals / safeAnalyticsData.totalGoalsCreated) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">{t('myGoals.paused')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{safeAnalyticsData.pausedGoals}</span>
                        <span className="text-xs text-gray-500">
                          ({safeAnalyticsData.totalGoalsCreated > 0 ? Math.round((safeAnalyticsData.pausedGoals / safeAnalyticsData.totalGoalsCreated) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  {t('analytics.productivityPatterns')}
                </CardTitle>
                <CardDescription>
                  {t('analytics.productivityDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-1">{t('analytics.bestPerformingDay')}</h3>
                      <p className="text-2xl font-bold text-blue-600">{safeAnalyticsData.bestPerformingDay}</p>
                      <p className="text-sm text-blue-700">{t('analytics.scheduleImportantTasks')}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h3 className="font-semibold text-purple-900 mb-1">{t('analytics.mostProductiveHour')}</h3>
                      <p className="text-2xl font-bold text-purple-600">{safeAnalyticsData.mostProductiveHour}:00 AM</p>
                      <p className="text-sm text-purple-700">{t('analytics.peakFocusTime')}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">{t('analytics.weeklyPerformance')}</h3>
                    {productivityPatterns.map((pattern) => (
                      <div key={pattern.dayOfWeek} className="flex items-center gap-4">
                        <span className="text-sm font-medium w-20">{pattern.dayOfWeek}</span>
                        <ProgressBar value={pattern.completionRate} className="flex-1" />
                        <span className="text-sm text-gray-600 w-16">{pattern.completionRate.toFixed(1)}%</span>
                        <span className="text-xs text-gray-500 w-16">{pattern.tasksCompleted} {t('progressPage.tasks')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.goalCategoryPerformance')}</CardTitle>
                <CardDescription>
                  {t('analytics.categoryDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {goalCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <Folder className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('analytics.noCategoriesYet')}</h3>
                    <p className="text-gray-600">{t('analytics.createCategoriesForInsights')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goalCategories.map((category) => (
                      <div key={category.name} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{category.name}</h3>
                          <Badge variant="secondary">{category.count} {category.count !== 1 ? t('analytics.goals') : t('analytics.goal')}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">{t('dashboard.successRate')}</p>
                            <div className="flex items-center gap-2">
                              <ProgressBar value={category.successRate} className="flex-1" />
                              <span className="text-sm font-medium">{category.successRate.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">{t('analytics.avgCompletionTime')}</p>
                            <p className="text-lg font-semibold">
                              {category.avgTimeToComplete > 0 ? `${category.avgTimeToComplete} ${t('analytics.days')}` : t('analytics.na')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="mr-2 h-5 w-5" />
                  {t('analytics.aiPoweredInsights')}
                </CardTitle>
                <CardDescription>
                  {t('analytics.personalizedRecommendations')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{insight.title}</h3>
                            <Badge className={getInsightBadgeColor(insight.type)}>
                              {insight.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                          {insight.actionable && (
                            <Button size="sm" variant="outline">
                              <Lightbulb className="h-4 w-4 mr-2" />
                              Apply Suggestion
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default withErrorBoundary(Analytics);