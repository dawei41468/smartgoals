import React from 'react';
import { TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';

export function ProgressHeader() {
  return (
    <PageHeader
      icon={TrendingUp}
      titleKey="progressPage.title"
      subtitleKey="progressPage.description"
    />
  );
}
