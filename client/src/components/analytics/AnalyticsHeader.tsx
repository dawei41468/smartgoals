import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/shared/PageHeader';

interface AnalyticsHeaderProps {
  timePeriod: string;
  onTimePeriodChange: (period: string) => void;
}

export function AnalyticsHeader({ timePeriod, onTimePeriodChange }: AnalyticsHeaderProps) {
  const { t } = useLanguage();

  return (
    <PageHeader
      icon={BarChart3}
      titleKey="analytics.title"
      subtitleKey="analytics.description"
    >
      <Select value={timePeriod} onValueChange={onTimePeriodChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('analytics.selectPeriod')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">{t('common.thisWeek')}</SelectItem>
          <SelectItem value="month">{t('common.thisMonth')}</SelectItem>
          <SelectItem value="quarter">{t('analytics.thisQuarter')}</SelectItem>
          <SelectItem value="year">{t('analytics.thisYear')}</SelectItem>
        </SelectContent>
      </Select>
    </PageHeader>
  );
}
