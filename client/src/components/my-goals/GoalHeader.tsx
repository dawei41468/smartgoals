import React from 'react';
import { Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface GoalHeaderProps {
  onCreateGoal: () => void;
}

export function GoalHeader({ onCreateGoal }: GoalHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Target className="text-secondary mr-3 h-7 w-7" />
            {t('myGoals.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{t('myGoals.trackProgress')}</p>
        </div>
        <Button onClick={onCreateGoal} data-testid="button-create-new-goal">
          <Plus className="h-4 w-4 mr-2" />
          {t('myGoals.createNewGoal')}
        </Button>
      </div>
    </div>
  );
}
