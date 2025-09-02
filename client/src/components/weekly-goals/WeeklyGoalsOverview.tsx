import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, Calendar, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { WeeklyGoalResponse } from '@/lib/types';
import { getStatusColor } from '@/lib/goalUtils';
import { formatDateRange } from '@/lib/dateUtils';

interface WeeklyGoalsOverviewProps {
  weeklyGoals: WeeklyGoalResponse[];
  goalId: string;
  onWeeklyGoalClick?: (weeklyGoalId: string) => void;
}

export function WeeklyGoalsOverview({
  weeklyGoals,
  goalId,
  onWeeklyGoalClick
}: WeeklyGoalsOverviewProps) {
  // Calculate overall progress
  const totalGoals = weeklyGoals.length;
  const completedGoals = weeklyGoals.filter(wg => wg.status === 'completed').length;
  const activeGoals = weeklyGoals.filter(wg => wg.status === 'active').length;
  const pendingGoals = weeklyGoals.filter(wg => wg.status === 'pending').length;

  const overallProgress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  // Calculate total estimated hours across all goals
  const totalEstimatedHours = weeklyGoals.reduce((total, wg) => {
    // This would need to be calculated from tasks, but for now we'll use a placeholder
    return total + (wg.progress || 0);
  }, 0);

  // Get upcoming deadlines
  const upcomingDeadlines = weeklyGoals
    .filter(wg => wg.endDate && wg.status !== 'completed')
    .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())
    .slice(0, 3);

  if (weeklyGoals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Weekly Goals Yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Break down your main goal into manageable weekly milestones to track progress more effectively.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
            <div className="text-center p-4 border rounded-lg">
              <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium mb-1">Plan Ahead</h4>
              <p className="text-sm text-muted-foreground">Set clear weekly objectives</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium mb-1">Track Progress</h4>
              <p className="text-sm text-muted-foreground">Monitor completion rates</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium mb-1">Stay Motivated</h4>
              <p className="text-sm text-muted-foreground">Celebrate weekly wins</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Goals</p>
                <p className="text-2xl font-bold">{totalGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{activeGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{pendingGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {completedGoals} of {totalGoals} weekly goals completed
              </span>
              <span className="text-sm font-medium">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Weekly Goals List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {weeklyGoals.map((weeklyGoal) => (
          <Card
            key={weeklyGoal.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onWeeklyGoalClick?.(weeklyGoal.id!)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">Week {weeklyGoal.weekNumber}</CardTitle>
                  <h3 className="font-medium mt-1 truncate">{weeklyGoal.title}</h3>
                </div>
                <Badge
                  variant="outline"
                  className={getStatusColor(weeklyGoal.status || 'pending')}
                >
                  {weeklyGoal.status || 'pending'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              {weeklyGoal.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {weeklyGoal.description}
                </p>
              )}

              {weeklyGoal.startDate && weeklyGoal.endDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDateRange(weeklyGoal.startDate, weeklyGoal.endDate)}</span>
                </div>
              )}

              {/* Progress indicator - placeholder for now */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {weeklyGoal.progress || 0}%
                </span>
              </div>
              <Progress value={weeklyGoal.progress || 0} className="h-1.5 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.map((weeklyGoal) => (
                <div
                  key={weeklyGoal.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => onWeeklyGoalClick?.(weeklyGoal.id!)}
                >
                  <div>
                    <h4 className="font-medium">Week {weeklyGoal.weekNumber}</h4>
                    <p className="text-sm text-muted-foreground">{weeklyGoal.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(weeklyGoal.endDate!).toLocaleDateString()}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(weeklyGoal.status || 'pending')}`}
                    >
                      {weeklyGoal.status || 'pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
