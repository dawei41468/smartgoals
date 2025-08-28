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
    <Card className="mb-6 bg-gradient-to-r from-primary to-secondary text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">{t('progressPage.dailyMotivation')}</h3>
            <p className="text-primary-foreground/90">{getMotivationalMessage(language)}</p>
          </div>
          <Zap className="h-8 w-8 text-white/80" />
        </div>
      </CardContent>
    </Card>
  );
}
