import React from 'react';
import { Target, Clock, Zap, CheckCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface AnalyticsData {
  completionRate: number;
  goalSuccessRate?: number;
  monthlyComparison: {
    change: number;
  };
  avgCompletionTime: number;
  currentStreak: number;
  longestStreak: number;
  totalTasksCompleted: number;
}

interface AnalyticsMetricsGridProps {
  analyticsData: AnalyticsData;
}

export function AnalyticsMetricsGrid({ analyticsData }: AnalyticsMetricsGridProps) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">{t('analytics.completionRate')}</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{analyticsData.completionRate}%</p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            {analyticsData.monthlyComparison.change > 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-xs sm:text-sm ${analyticsData.monthlyComparison.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(analyticsData.monthlyComparison.change)}% {t('analytics.vsLastMonth')}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">{t('analytics.avgCompletionTime')}</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{analyticsData.avgCompletionTime} days</p>
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
              <p className="text-xl sm:text-2xl font-bold text-orange-600">{analyticsData.currentStreak} days</p>
            </div>
            <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">{t('analytics.personalBest')}: {analyticsData.longestStreak} {t('analytics.days')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">{t('analytics.tasksCompleted')}</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600">{analyticsData.totalTasksCompleted}</p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">{t('analytics.acrossAllGoals')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
