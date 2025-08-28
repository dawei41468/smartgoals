import React from 'react';
import { Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface GoalEmptyStateProps {
  hasGoals: boolean;
  onCreateGoal: () => void;
}

export function GoalEmptyState({ hasGoals, onCreateGoal }: GoalEmptyStateProps) {
  const { t } = useLanguage();

  return (
    <Card className="text-center py-12">
      <CardContent>
        <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {!hasGoals ? t('myGoals.noGoalsYet') : t('myGoals.noGoalsFound')}
        </h3>
        <p className="text-gray-600 mb-6">
          {!hasGoals 
            ? t('myGoals.startJourney')
            : t('myGoals.adjustSearch')}
        </p>
        {!hasGoals && (
          <Button onClick={onCreateGoal} data-testid="button-empty-create-goal">
            <Plus className="h-4 w-4 mr-2" />
            {t('myGoals.createFirstGoal')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
