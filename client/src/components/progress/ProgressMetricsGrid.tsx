import React from 'react';
import { Flame, CheckCircle, Target, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProgressStats {
  avgCompletionTime: number;
  completedGoals: number;
}

interface ProgressMetricsGridProps {
  progressStats: ProgressStats | null;
  weeklyCompletedTasks: number;
}

export function ProgressMetricsGrid({ progressStats, weeklyCompletedTasks }: ProgressMetricsGridProps) {
  const { t } = useLanguage();
  const safeStats = progressStats || { avgCompletionTime: 0, completedGoals: 0 };

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 mb-4 sm:mb-6">
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
        <CardContent className="p-2.5 sm:p-3 text-center">
          <div className="flex items-center justify-center mb-1.5 sm:mb-2">
            <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mr-1 sm:mr-1.5" />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-700">{safeStats.avgCompletionTime}</div>
          </div>
          <p className="text-[10px] sm:text-xs text-orange-600 font-medium">{t('progressPage.daysInRow')}</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-2.5 sm:p-3 text-center">
          <div className="flex items-center justify-center mb-1.5 sm:mb-2">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-1 sm:mr-1.5" />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-700">{weeklyCompletedTasks}</div>
          </div>
          <p className="text-[10px] sm:text-xs text-green-600 font-medium">{t('common.thisWeek')}</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-2.5 sm:p-3 text-center">
          <div className="flex items-center justify-center mb-1.5 sm:mb-2">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-1 sm:mr-1.5" />
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700">{safeStats.completedGoals}</span>
          </div>
          <p className="text-[10px] sm:text-xs text-blue-600 font-medium">{t('progressPage.goalsAchieved')}</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
        <CardContent className="p-2.5 sm:p-3 text-center">
          <div className="flex items-center justify-center mb-1.5 sm:mb-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 mr-1 sm:mr-1.5" />
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-700">{safeStats.avgCompletionTime}</span>
          </div>
          <p className="text-[10px] sm:text-xs text-purple-600 font-medium">{t('analytics.avgCompletionTime')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
