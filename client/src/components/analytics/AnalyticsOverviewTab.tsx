import React from 'react';
import { TrendingUp, PieChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProgressWithLabel } from '@/components/shared/ProgressWithLabel';
import { StatusLegendItem } from '@/components/shared/StatusLegendItem';

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
                <ProgressWithLabel
                  key={index}
                  label={days[index]}
                  value={progress}
                  labelWidth="w-10"
                  valueWidth="w-12"
                />
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
            <StatusLegendItem
              color="bg-green-500"
              label={t('myGoals.completed')}
              count={analyticsData.completedGoals}
              total={analyticsData.totalGoalsCreated}
            />
            <StatusLegendItem
              color="bg-blue-500"
              label={t('myGoals.active')}
              count={analyticsData.activeGoals}
              total={analyticsData.totalGoalsCreated}
            />
            <StatusLegendItem
              color="bg-yellow-500"
              label={t('myGoals.paused')}
              count={analyticsData.pausedGoals}
              total={analyticsData.totalGoalsCreated}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
