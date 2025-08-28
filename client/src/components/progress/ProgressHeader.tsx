import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function ProgressHeader() {
  const { t } = useLanguage();

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="text-secondary mr-3 h-7 w-7" />
            {t('progressPage.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{t('progressPage.trackYourJourney')}</p>
        </div>
      </div>
    </div>
  );
}
