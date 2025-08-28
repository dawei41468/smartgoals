import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PageHeaderProps {
  icon: LucideIcon;
  titleKey: string;
  subtitleKey: string;
  children?: React.ReactNode;
}

export function PageHeader({ icon: Icon, titleKey, subtitleKey, children }: PageHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Icon className="text-secondary mr-3 h-7 w-7" />
            {t(titleKey)}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{t(subtitleKey)}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
