import React from 'react';
import { TrendingUp, PieChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';

interface AnalyticsData {
  weeklyProgressTrend: number[];
  completedGoals: number;
  activeGoals: number;
  pausedGoals: number;
  totalGoalsCreated: number;
}

interface AnalyticsOverviewTabProps {
  analyticsData: AnalyticsData;
}

export function AnalyticsOverviewTab({ analyticsData }: AnalyticsOverviewTabProps) {
  const { t } = useLanguage();

  return (
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
  );
}
