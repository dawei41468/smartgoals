import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface GoalWizardActionButtonsProps {
  onSaveDraft: () => void;
  saveDraftPending: boolean;
  isGenerating: boolean;
  isFormValid: boolean;
}

export function GoalWizardActionButtons({
  onSaveDraft,
  saveDraftPending,
  isGenerating,
  isFormValid
}: GoalWizardActionButtonsProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 pt-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onSaveDraft}
        disabled={saveDraftPending}
        className="flex-1 text-sm"
      >
        {saveDraftPending ? t('common.loading') : t('goalWizard.saveDraft')}
      </Button>
      <Button
        type="submit"
        disabled={isGenerating || !isFormValid}
        className="flex-1 text-sm"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {t('goalWizard.generating')}
          </>
        ) : (
          <>
            <ArrowRight className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t('goalWizard.generateBreakdown')}</span>
            <span className="sm:hidden">{t('goalWizard.generateBreakdownMobile')}</span>
          </>
        )}
      </Button>
    </div>
  );
}
