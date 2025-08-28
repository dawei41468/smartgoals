import React from 'react';
import { Folder } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface CategoryPerformance {
  name: string;
  count: number;
  successRate: number;
  avgTimeToComplete: number;
}

interface AnalyticsCategoriesTabProps {
  goalCategories: CategoryPerformance[];
}

export function AnalyticsCategoriesTab({ goalCategories }: AnalyticsCategoriesTabProps) {
  const { t } = useLanguage();

  return (
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
  );
}
