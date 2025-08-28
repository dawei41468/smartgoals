import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoalWizardHeaderProps {
  isEditing: boolean;
  onClose: () => void;
}

export function GoalWizardHeader({ isEditing, onClose }: GoalWizardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 sm:mb-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
        {isEditing ? "Edit Your SMART(ER) Goal" : "Create Your SMART(ER) Goal"}
      </h1>
      <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-wizard">
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}
