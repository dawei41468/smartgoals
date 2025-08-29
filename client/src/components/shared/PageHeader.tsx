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
    <div className="mb-4 sm:mb-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Icon className="text-secondary mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
            {t(titleKey)}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">{t(subtitleKey)}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
