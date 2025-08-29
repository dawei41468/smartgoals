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
    <div className="mb-4">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center leading-tight">
            <Icon className="text-secondary mr-2 h-5 w-5 flex-shrink-0" />
            <span className="truncate">{t(titleKey)}</span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{t(subtitleKey)}</p>
        </div>
        {children && (
          <div className="flex justify-start">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
