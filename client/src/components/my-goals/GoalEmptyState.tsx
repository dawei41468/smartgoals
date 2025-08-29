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
    <Card className="text-center py-8">
      <CardContent className="px-4">
        <Target className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-2 leading-tight">
          {!hasGoals ? t('myGoals.noGoalsYet') : t('myGoals.noGoalsFound')}
        </h3>
        <p className="text-sm text-gray-600 mb-5 leading-relaxed">
          {!hasGoals
            ? t('myGoals.startJourney')
            : t('myGoals.adjustSearch')}
        </p>
        {!hasGoals && (
          <Button onClick={onCreateGoal} data-testid="button-empty-create-goal" className="w-full h-11 text-base">
            <Plus className="h-4 w-4 mr-2" />
            {t('myGoals.createFirstGoal')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
