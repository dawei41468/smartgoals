import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

export default function Analytics() {
  const [timePeriod, setTimePeriod] = useState("month");
  const [selectedMetric, setSelectedMetric] = useState("completion_rate");
  const { t } = useLanguage();

  // Fetch goals with detailed breakdown
  const { data: goals = [], isLoading: goalsLoading } = useQuery<GoalWithBreakdown[]>({
    queryKey: ["/api/goals/detailed"],
  });

  // Mock analytics data - would be calculated from real data
  const analyticsData: AnalyticsData = {
    goalSuccessRate: goals.length > 0 ? Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100) : 0,
    avgCompletionTime: 23,
    totalGoalsCreated: goals.length,
    completedGoals: goals.filter(g => g.status === 'completed').length,
    activeGoals: goals.filter(g => g.status === 'active').length,
    pausedGoals: goals.filter(g => g.status === 'paused').length,
    totalTasksCompleted: 47,
    currentStreak: 5,
    longestStreak: 12,
    bestPerformingDay: "Tuesday",
    mostProductiveHour: 10,
    weeklyProgressTrend: [65, 72, 68, 75, 80, 78, 85],
    monthlyComparison: {
      thisMonth: 12,
      lastMonth: 8,
      change: 50,
    },
  };

  // Calculate real category performance from goals data
  const goalCategories: GoalCategory[] = ["Health", "Work", "Family", "Personal"].map(category => {
    const categoryGoals = goals.filter(goal => goal.category === category);
    const completedGoals = categoryGoals.filter(goal => goal.status === 'completed');
    const successRate = categoryGoals.length > 0 ? Math.round((completedGoals.length / categoryGoals.length) * 100) : 0;
    
    // Calculate average time to complete (mock calculation for now)
    const avgTimeToComplete = completedGoals.length > 0 ? 
      Math.round(completedGoals.reduce((acc, goal) => {
        const created = new Date(goal.createdAt || 0);
        const updated = new Date(goal.updatedAt || 0);
        return acc + Math.max(1, Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
      }, 0) / completedGoals.length) : 0;
    
    return {
      name: category,
      count: categoryGoals.length,
      successRate,
      avgTimeToComplete,
    };
  }).filter(category => category.count > 0); // Only show categories with goals

  const productivityPatterns: ProductivityPattern[] = [
    { dayOfWeek: "Monday", completionRate: 78, tasksCompleted: 12 },
    { dayOfWeek: "Tuesday", completionRate: 85, tasksCompleted: 15 },
    { dayOfWeek: "Wednesday", completionRate: 72, tasksCompleted: 11 },
    { dayOfWeek: "Thursday", completionRate: 80, tasksCompleted: 14 },
    { dayOfWeek: "Friday", completionRate: 68, tasksCompleted: 10 },
    { dayOfWeek: "Saturday", completionRate: 60, tasksCompleted: 8 },
    { dayOfWeek: "Sunday", completionRate: 55, tasksCompleted: 7 },
  ];

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

  if (goalsLoading) {
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
                <SelectTrigger className="w-32" data-testid="select-time-period">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('dashboard.successRate')}</p>
                  <p className="text-2xl font-bold text-green-600">{analyticsData.goalSuccessRate}%</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center">
                {analyticsData.monthlyComparison.change > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${analyticsData.monthlyComparison.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(analyticsData.monthlyComparison.change)}% {t('analytics.vsLastMonth')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('analytics.avgCompletionTime')}</p>
                  <p className="text-2xl font-bold text-blue-600">{analyticsData.avgCompletionTime} days</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{t('analytics.timeToComplete')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('analytics.streakDays')}</p>
                  <p className="text-2xl font-bold text-orange-600">{analyticsData.currentStreak} days</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{t('analytics.personalBest')}: {analyticsData.longestStreak} {t('analytics.days')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('dashboard.tasksCompleted')}</p>
                  <p className="text-2xl font-bold text-purple-600">{analyticsData.totalTasksCompleted}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{t('analytics.acrossAllGoals')}</p>
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
                    {analyticsData.weeklyProgressTrend.map((progress, index) => {
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
                        <span className="text-sm font-medium">{analyticsData.completedGoals}</span>
                        <span className="text-xs text-gray-500">
                          ({analyticsData.totalGoalsCreated > 0 ? Math.round((analyticsData.completedGoals / analyticsData.totalGoalsCreated) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">{t('myGoals.active')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{analyticsData.activeGoals}</span>
                        <span className="text-xs text-gray-500">
                          ({analyticsData.totalGoalsCreated > 0 ? Math.round((analyticsData.activeGoals / analyticsData.totalGoalsCreated) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">{t('myGoals.paused')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{analyticsData.pausedGoals}</span>
                        <span className="text-xs text-gray-500">
                          ({analyticsData.totalGoalsCreated > 0 ? Math.round((analyticsData.pausedGoals / analyticsData.totalGoalsCreated) * 100) : 0}%)
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
                      <p className="text-2xl font-bold text-blue-600">{analyticsData.bestPerformingDay}</p>
                      <p className="text-sm text-blue-700">{t('analytics.scheduleImportantTasks')}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h3 className="font-semibold text-purple-900 mb-1">{t('analytics.mostProductiveHour')}</h3>
                      <p className="text-2xl font-bold text-purple-600">{analyticsData.mostProductiveHour}:00 AM</p>
                      <p className="text-sm text-purple-700">{t('analytics.peakFocusTime')}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">{t('analytics.weeklyPerformance')}</h3>
                    {productivityPatterns.map((pattern) => (
                      <div key={pattern.dayOfWeek} className="flex items-center gap-4">
                        <span className="text-sm font-medium w-20">{pattern.dayOfWeek}</span>
                        <ProgressBar value={pattern.completionRate} className="flex-1" />
                        <span className="text-sm text-gray-600 w-16">{pattern.completionRate}%</span>
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
                              <span className="text-sm font-medium">{category.successRate}%</span>
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