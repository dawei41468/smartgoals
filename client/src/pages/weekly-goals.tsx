import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target } from 'lucide-react';
import { WeeklyGoalsManager } from '@/components/weekly-goals/WeeklyGoalsManager';
import { useAppStore } from '@/stores/appStore';
import { api } from '@/lib/api';
import type { GoalWithBreakdownResponse } from '@/lib/types';

function WeeklyGoalsPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const goalId = params.goalId;
  const { toast } = useToast();
  const [goal, setGoal] = useState<GoalWithBreakdownResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { setWeeklyGoals, setDailyTasks } = useAppStore();

  useEffect(() => {
    if (!goalId) {
      navigate('/my-goals');
      return;
    }

    loadGoal();
  }, [goalId]);

  const loadGoal = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load the goal with breakdown (includes weekly goals and tasks)
      const goalData = await api.getGoal(goalId!);
      setGoal(goalData);

      // Update the store with the loaded data
      const store = useAppStore.getState();
      store.setWeeklyGoals(goalData.weeklyGoals.flatMap(wg =>
        wg.tasks ? [wg] : [wg]
      ));
      store.setDailyTasks(goalData.weeklyGoals.flatMap(wg =>
        wg.tasks || []
      ));

    } catch (err) {
      console.error('Failed to load goal:', err);
      setError('Failed to load goal details. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load goal details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/my-goals');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Goal Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'The goal you\'re looking for doesn\'t exist or has been deleted.'}
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Goals
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Goals
          </Button>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{goal.title}</h1>
                <p className="text-muted-foreground mb-4">{goal.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>Progress: {goal.progress}%</span>
                  </div>
                  <div>
                    Deadline: {new Date(goal.deadline).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Goals Manager */}
        <WeeklyGoalsManager
          goalId={goalId!}
          goalTitle={goal.title}
        />
      </div>
    </div>
  );
}

export default WeeklyGoalsPage;
