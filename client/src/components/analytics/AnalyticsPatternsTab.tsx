import React from 'react';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProgressWithLabel } from '@/components/shared/ProgressWithLabel';

interface ProductivityPattern {
  dayOfWeek: string;
  completionRate: number;
  tasksCompleted: number;
}

interface AnalyticsData {
  bestPerformingDay: string;
  mostProductiveHour: number;
}

interface AnalyticsPatternsTabProps {
  analyticsData: AnalyticsData;
  productivityPatterns: ProductivityPattern[];
}

export function AnalyticsPatternsTab({ analyticsData, productivityPatterns }: AnalyticsPatternsTabProps) {
  const { t } = useLanguage();

  return (
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
            {productivityPatterns.length > 0 ? (
              productivityPatterns.map((pattern) => (
                <div key={pattern.dayOfWeek} className="flex items-center gap-4">
                  <ProgressWithLabel
                    label={pattern.dayOfWeek}
                    value={pattern.completionRate}
                    labelWidth="w-20"
                    valueWidth="w-16"
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-16">{pattern.tasksCompleted} {t('progressPage.tasks')}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">{t('analytics.noDataAvailable')}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
