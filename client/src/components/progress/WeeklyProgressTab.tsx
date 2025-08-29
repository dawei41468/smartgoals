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
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              <h2 className="text-lg font-semibold">{t('progressPage.weeklyProgress')}</h2>
            </div>
            <div className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
              {weeklyCompletedTasks}/{weeklyTotalTasks}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t('progressPage.completeDailyTasks')}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <ProgressBar value={currentWeekProgress} className="w-full h-2" />
          <div className="text-xs text-gray-600 mt-2 text-center">
            {currentWeekProgress}% complete this week
          </div>
          <div className="grid grid-cols-7 gap-0.5 mt-3">
            {daysOfWeek.map((day, index) => (
              <div
                key={index}
                className={`p-1.5 rounded-md border text-center min-h-[50px] flex flex-col justify-between ${
                  day.isToday
                    ? 'border-primary bg-primary/10'
                    : day.completed === day.total && day.total > 0
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="text-[9px] font-medium text-gray-700 leading-tight">
                  {t(`progressPage.daysOfWeekShort.${day.key}`)}
                </div>
                <div className="text-[10px] text-gray-500 font-medium">{day.date.getDate()}</div>
                {day.total > 0 && (
                  <div className="mt-0.5">
                    <div className={`w-4 h-4 rounded-full mx-auto flex items-center justify-center text-[8px] font-bold ${
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
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('progressPage.todaysTasks')}</h2>
              <div className="text-xs text-muted-foreground bg-blue-100 px-2 py-1 rounded-full">
                {todaysTasks.length} tasks
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t('progressPage.todaysTasksSubtitle')}</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
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
