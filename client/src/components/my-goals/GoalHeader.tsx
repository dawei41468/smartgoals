import React from 'react';
import { Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';

interface GoalHeaderProps {
  onCreateGoal: () => void;
}

export function GoalHeader({ onCreateGoal }: GoalHeaderProps) {
  const { t } = useLanguage();
  
  return (
    <PageHeader 
      icon={Target} 
      titleKey="myGoals.title" 
      subtitleKey="myGoals.trackProgress"
    >
      <Button onClick={onCreateGoal} data-testid="button-create-new-goal">
        <Plus className="h-4 w-4 mr-2" />
        {t('myGoals.createNewGoal')}
      </Button>
    </PageHeader>
  );
}
