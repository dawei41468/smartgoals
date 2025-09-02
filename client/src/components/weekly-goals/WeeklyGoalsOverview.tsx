import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { WeeklyGoalResponse } from '@/lib/types';
import { getStatusColor } from '@/lib/goalUtils';

interface WeeklyGoalsOverviewProps {
  weeklyGoals: WeeklyGoalResponse[];
  goalId: string;
  onWeeklyGoalClick?: (weeklyGoalId: string) => void;
  // Optional mapping to override progress values using up-to-date task completion
  progressByWeeklyGoal?: Record<string, number>;
}

export function WeeklyGoalsOverview({
  weeklyGoals,
  goalId,
  onWeeklyGoalClick,
  progressByWeeklyGoal
}: WeeklyGoalsOverviewProps) {
  // Derive status from progress to ensure consistency
  const normalized = weeklyGoals.map((wg) => {
    const overridden = progressByWeeklyGoal?.[wg.id!];
    const progress = typeof overridden === 'number' ? overridden : (typeof wg.progress === 'number' ? wg.progress : 0);
    const derivedStatus = progress >= 100 ? 'completed' : progress > 0 ? 'active' : (wg.status || 'pending');
    return { ...wg, __derivedStatus: derivedStatus as 'pending' | 'active' | 'completed', __progress: progress };
  });

  // Calculate overall progress
  const totalGoals = normalized.length;
  const completedGoals = normalized.filter(wg => wg.__derivedStatus === 'completed').length;
  const activeGoals = normalized.filter(wg => wg.__derivedStatus === 'active').length;
  const pendingGoals = normalized.filter(wg => wg.__derivedStatus === 'pending').length;

  const overallProgress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  // Calculate total estimated hours across all goals
  const totalEstimatedHours = normalized.reduce((total, wg) => {
    // This would need to be calculated from tasks, but for now we'll use a placeholder
    return total + (wg.__progress || 0);
  }, 0);

  // Get upcoming deadlines
  const upcomingDeadlines = normalized
    .filter(wg => wg.endDate && wg.__derivedStatus !== 'completed')
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                {overallProgress.toFixed(1)}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Removed per-goal list to avoid duplication with Milestones tab */}

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
