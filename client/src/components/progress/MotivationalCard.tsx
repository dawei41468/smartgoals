import React from 'react';
import { Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface MotivationalCardProps {
  getMotivationalMessage: (language: string) => string;
}

export function MotivationalCard({ getMotivationalMessage }: MotivationalCardProps) {
  const { t, language } = useLanguage();

  return (
    <Card className="mb-4 sm:mb-6 bg-gradient-to-r from-primary to-secondary text-white">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{t('progressPage.dailyMotivation')}</h3>
            <p className="text-sm sm:text-base text-primary-foreground/90 leading-relaxed">
              {getMotivationalMessage(language)}
            </p>
          </div>
          <Zap className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white/80 flex-shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}
