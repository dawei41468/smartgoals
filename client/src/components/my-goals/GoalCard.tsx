import React, { memo, useState } from 'react';
import { Calendar, Clock, TrendingUp, MoreHorizontal, Edit, Pause, Play, CheckCircle, Trash2 } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, getDaysUntilDeadline, isOverdue } from '@/lib/dateUtils';
import { getStatusColor, getStatusDisplayText } from '@/lib/goalUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { Goal, GoalWithBreakdown } from '@/lib/schema';

interface GoalCardProps {
  goal: GoalWithBreakdown;
  isExpanded: boolean;
  onToggleExpand: (goalId: string) => void;
  onEditGoal: (goal: GoalWithBreakdown) => void;
  onStatusChange: (goalId: string, status: Goal["status"]) => Promise<void>;
  onDeleteGoal: (goalId: string) => void;
  displayProgress?: number;
}

export const GoalCard = memo(function GoalCard({
  goal,
  isExpanded,
  onToggleExpand,
  onEditGoal,
  onStatusChange,
  onDeleteGoal,
  displayProgress
}: GoalCardProps) {
  const { t } = useLanguage();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // Optimistic state for goal status
  const [optimisticStatus, setOptimisticStatus] = useState<Goal["status"]>(goal.status);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // Sync with prop changes
  React.useEffect(() => {
    setOptimisticStatus(goal.status);
  }, [goal.status]);

  // Optimistic status change handler
  const handleStatusChange = async (newStatus: Goal["status"]) => {
    const originalStatus = optimisticStatus;

    // Optimistic update - immediate UI change
    setOptimisticStatus(newStatus);
    setIsStatusUpdating(true);

    try {
      // API call in background
      await onStatusChange(goal.id, newStatus);
    } catch (error) {
      // Rollback on error
      setOptimisticStatus(originalStatus);
      console.error('Failed to update goal status:', error);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleDeleteClick = () => {
    showConfirmDialog(
      {
        title: 'Delete Goal',
        description: `Are you sure you want to delete "${goal.title}"? This action cannot be undone and will permanently remove the goal and all its associated tasks.`,
        confirmText: 'Delete Goal',
        cancelText: 'Cancel',
        variant: 'destructive',
      },
      () => onDeleteGoal(goal.id)
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="space-y-3">
          {/* Title and Description */}
          <div>
            <CardTitle className="text-lg leading-tight mb-1">{goal.title}</CardTitle>
            {goal.description && (
              <CardDescription className="text-sm leading-relaxed">{goal.description}</CardDescription>
            )}
          </div>

          {/* Status and Date Badges - Mobile optimized */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`${getStatusColor(optimisticStatus)} transition-colors text-xs px-2 py-1 ${
              isStatusUpdating ? 'opacity-70 animate-pulse' : ''
            }`}>
              {getStatusDisplayText(optimisticStatus)}
            </Badge>

            <div className={`flex items-center text-xs ${isOverdue(goal.deadline) ? 'text-red-600' : 'text-gray-600'}`}>
              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{formatDate(goal.deadline)}</span>
              {isOverdue(goal.deadline) && (
                <Badge className="ml-1 bg-red-100 text-red-800 border-red-200 text-xs px-1.5 py-0.5">
                  Overdue
                </Badge>
              )}
            </div>
          </div>

          {/* Time indicators - Mobile optimized */}
          <div className="flex flex-wrap items-center gap-3">
            {goal.deadline && getDaysUntilDeadline(goal.deadline) >= 0 && (
              <div className="flex items-center text-xs text-gray-600">
                <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                {getDaysUntilDeadline(goal.deadline)} {t('myGoals.daysLeft')}
              </div>
            )}
            {goal.deadline && isOverdue(goal.deadline) && (
              <div className="flex items-center text-xs text-red-600">
                <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                {Math.abs(getDaysUntilDeadline(goal.deadline))} days overdue
              </div>
            )}
          </div>

          {/* Progress and Actions - Mobile optimized */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-1 text-xs text-gray-600 flex-shrink-0">
                <TrendingUp className="h-3 w-3" />
                <span className="font-medium">{typeof displayProgress === 'number' ? displayProgress.toFixed(1) : (goal.progress || 0)}%</span>
              </div>
              <Progress value={typeof displayProgress === 'number' ? displayProgress : (goal.progress || 0)} className="flex-1 h-2" />
            </div>

            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleExpand(goal.id)}
                data-testid={`button-expand-${goal.id}`}
                className="h-8 px-3 text-xs font-medium"
              >
                {isExpanded ? 'Less' : 'More'}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid={`button-menu-${goal.id}`} className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => onEditGoal(goal)}
                    data-testid={`menu-edit-${goal.id}`}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Goal
                  </DropdownMenuItem>
                  {optimisticStatus === "active" && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("paused")}
                      disabled={isStatusUpdating}
                      data-testid={`menu-pause-${goal.id}`}
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pause Goal
                    </DropdownMenuItem>
                  )}
                  {optimisticStatus === "paused" && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("active")}
                      disabled={isStatusUpdating}
                      data-testid={`menu-resume-${goal.id}`}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Resume Goal
                    </DropdownMenuItem>
                  )}
                  {optimisticStatus !== "completed" && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("completed")}
                      disabled={isStatusUpdating}
                      data-testid={`menu-complete-${goal.id}`}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Complete
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDeleteClick}
                    className="text-red-600"
                    data-testid={`menu-delete-${goal.id}`}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Goal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>
      <ConfirmDialog />
    </Card>
  );
});
