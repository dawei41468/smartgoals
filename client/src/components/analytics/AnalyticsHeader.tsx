import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

interface AnalyticsHeaderProps {
  timePeriod: string;
  onTimePeriodChange: (period: string) => void;
}

export function AnalyticsHeader({ timePeriod, onTimePeriodChange }: AnalyticsHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="text-secondary mr-3 h-7 w-7" />
            {t('analytics.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{t('analytics.trackYourProgress')}</p>
        </div>
        <Select value={timePeriod} onValueChange={onTimePeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('analytics.selectPeriod')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{t('analytics.thisWeek')}</SelectItem>
            <SelectItem value="month">{t('analytics.thisMonth')}</SelectItem>
            <SelectItem value="quarter">{t('analytics.thisQuarter')}</SelectItem>
            <SelectItem value="year">{t('analytics.thisYear')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
