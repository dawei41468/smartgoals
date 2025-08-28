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
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <Card>
        <CardContent className="p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500 mr-1 sm:mr-2" />
            <div className="text-2xl font-bold">{safeStats.avgCompletionTime}</div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">{t('analytics.streakDays')}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t('progressPage.daysInRow')}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mr-1 sm:mr-2" />
            <div className="text-2xl font-bold">{weeklyCompletedTasks}</div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">{t('common.thisWeek')}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t('progressPage.tasksCompleted')}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mr-1 sm:mr-2" />
            <span className="text-xl sm:text-2xl font-bold">{safeStats.completedGoals}</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">{t('progressPage.goalsAchieved')}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t('progressPage.totalCompleted')}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 mr-1 sm:mr-2" />
            <span className="text-xl sm:text-2xl font-bold">{safeStats.avgCompletionTime}</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">{t('analytics.avgCompletionTime')}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t('progressPage.daysPerGoal')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
