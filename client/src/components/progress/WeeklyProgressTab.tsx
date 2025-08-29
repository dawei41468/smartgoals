import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { TaskItem } from '@/components/shared/TaskItem';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: string;
  estimatedHours?: number;
  date?: string;
}

interface DayOfWeek {
  key: string;
  date: Date;
  isToday: boolean;
  completed: number;
  total: number;
}

interface WeeklyProgressTabProps {
  currentWeekProgress: number;
  weeklyCompletedTasks: number;
  weeklyTotalTasks: number;
  getDaysOfWeek: () => DayOfWeek[];
  currentWeekTasks: Task[];
  handleTaskToggle: (taskId: string, completed: boolean) => Promise<void>;
}

export function WeeklyProgressTab({
  currentWeekProgress,
  weeklyCompletedTasks,
  weeklyTotalTasks,
  getDaysOfWeek,
  currentWeekTasks,
  handleTaskToggle
}: WeeklyProgressTabProps) {
  const { t } = useLanguage();

  const todaysTasks = useMemo(() => {
    const today = new Date().toDateString();
    return currentWeekTasks.filter(task => {
      const taskDate = new Date(task.date || '');
      return taskDate.toDateString() === today;
    });
  }, [currentWeekTasks]);

  const daysOfWeek = useMemo(() => getDaysOfWeek(), [getDaysOfWeek]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            {t('progressPage.weeklyProgress')}
          </CardTitle>
          <CardDescription>
            {t('progressPage.completeDailyTasks')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressBar value={currentWeekProgress} className="w-full" />
          <div className="text-sm text-gray-600 mt-2">
            {weeklyCompletedTasks} of {weeklyTotalTasks} tasks completed
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-4">
            {daysOfWeek.map((day, index) => (
              <div
                key={index}
                className={`p-1.5 sm:p-3 rounded-lg border text-center ${
                  day.isToday
                    ? 'border-primary bg-primary/5'
                    : day.completed === day.total && day.total > 0
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="text-[10px] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                  {t(`progressPage.daysOfWeekShort.${day.key}`)}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{day.date.getDate()}</div>
                {day.total > 0 && (
                  <div className="mt-1 sm:mt-2">
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full mx-auto flex items-center justify-center text-[9px] sm:text-xs ${
                      day.completed === day.total
                        ? 'bg-green-500 text-white'
                        : day.completed > 0
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {day.completed}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Tasks */}
      {todaysTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('progressPage.todaysTasks')}</CardTitle>
            <CardDescription>{t('progressPage.todaysTasksSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleTaskToggle}
                  testIdPrefix="today-task"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
