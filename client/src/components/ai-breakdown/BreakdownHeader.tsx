import React from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StepIndicator from '@/components/shared/StepIndicator';

interface BreakdownHeaderProps {
  onRegenerate: () => void;
  onSave: () => void;
  isRegenerating: boolean;
  isSaving: boolean;
}

export function BreakdownHeader({ 
  onRegenerate, 
  onSave, 
  isRegenerating, 
  isSaving 
}: BreakdownHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="mb-6 sm:mb-8">
        <StepIndicator 
          currentStep={2}
          steps={[
            { label: "SMART(ER) Setup", mobileLabel: "Setup" },
            { label: "AI Breakdown", mobileLabel: "AI" },
            { label: "Review & Save", mobileLabel: "Save" }
          ]}
        />
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <Button 
          variant="outline" 
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="w-full sm:w-auto"
          data-testid="button-regenerate"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          {isRegenerating ? "Regenerating..." : "Regenerate"}
        </Button>
        <Button 
          onClick={onSave}
          disabled={isSaving}
          className="w-full sm:w-auto"
          data-testid="button-save-goal"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Goal"}
        </Button>
      </div>
    </div>
  );
}
