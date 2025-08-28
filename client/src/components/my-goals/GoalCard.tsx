import React from 'react';
import { Calendar, Clock, TrendingUp, MoreHorizontal, Edit, Pause, Play, CheckCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { Goal, GoalWithBreakdown } from '@/lib/schema';

interface GoalCardProps {
  goal: GoalWithBreakdown;
  isExpanded: boolean;
  onToggleExpand: (goalId: string) => void;
  onEditGoal: (goal: GoalWithBreakdown) => void;
  onStatusChange: (goalId: string, status: Goal["status"]) => void;
  onDeleteGoal: (goalId: string) => void;
}

export function GoalCard({ 
  goal, 
  isExpanded, 
  onToggleExpand, 
  onEditGoal, 
  onStatusChange, 
  onDeleteGoal 
}: GoalCardProps) {
  const { t } = useLanguage();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:gap-4">
          <div className="order-1 flex-1">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <CardTitle className="text-lg sm:text-xl mb-2">{goal.title}</CardTitle>
                {goal.description && (
                  <CardDescription className="text-sm sm:text-base">{goal.description}</CardDescription>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge className={getStatusColor(goal.status)}>
                    {getStatusDisplayText(goal.status)}
                  </Badge>
                  <div className={`flex items-center text-sm ${isOverdue(goal.deadline) ? 'text-red-600' : 'text-gray-600'}`}>
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(goal.deadline)}
                    {isOverdue(goal.deadline) && (
                      <Badge className="ml-2 bg-red-100 text-red-800 border-red-200">
                        Overdue
                      </Badge>
                    )}
                  </div>
                  {goal.deadline && getDaysUntilDeadline(goal.deadline) >= 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {getDaysUntilDeadline(goal.deadline)} {t('myGoals.daysLeft')}
                    </div>
                  )}
                  {goal.deadline && isOverdue(goal.deadline) && (
                    <div className="flex items-center text-sm text-red-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {Math.abs(getDaysUntilDeadline(goal.deadline))} days overdue
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="order-2 flex items-start gap-2">
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="h-4 w-4" />
                <span>{goal.progress || 0}%</span>
              </div>
              <Progress value={goal.progress || 0} className="w-24" />
            </div>
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleExpand(goal.id)}
                data-testid={`button-expand-${goal.id}`}
              >
                {isExpanded ? 'Less' : 'More'}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid={`button-menu-${goal.id}`}>
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
                  {goal.status === "active" && (
                    <DropdownMenuItem 
                      onClick={() => onStatusChange(goal.id, "paused")}
                      data-testid={`menu-pause-${goal.id}`}
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pause Goal
                    </DropdownMenuItem>
                  )}
                  {goal.status === "paused" && (
                    <DropdownMenuItem 
                      onClick={() => onStatusChange(goal.id, "active")}
                      data-testid={`menu-resume-${goal.id}`}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Resume Goal
                    </DropdownMenuItem>
                  )}
                  {goal.status !== "completed" && (
                    <DropdownMenuItem 
                      onClick={() => onStatusChange(goal.id, "completed")}
                      data-testid={`menu-complete-${goal.id}`}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Complete
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDeleteGoal(goal.id)}
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
    </Card>
  );
}
