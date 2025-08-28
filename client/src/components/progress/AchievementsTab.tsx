import React from 'react';
import { Award, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

interface AchievementsTabProps {
  achievements: Achievement[];
}

export function AchievementsTab({ achievements }: AchievementsTabProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Award className="mr-2 h-5 w-5" />
          {t('progressPage.achievements')}
        </CardTitle>
        <CardDescription>{t('progressPage.achievementsSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 border rounded-lg ${
                achievement.unlockedAt
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-full ${
                  achievement.unlockedAt
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {achievement.unlockedAt ? (
                    <Star className="h-4 w-4" />
                  ) : (
                    <Award className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{achievement.title}</h3>
                  <p className="text-xs text-gray-600">{achievement.description}</p>
                </div>
              </div>
              {achievement.unlockedAt ? (
                <Badge variant="secondary" className="mt-2">
                  {t('progressPage.unlocked')}
                </Badge>
              ) : achievement.target && achievement.progress !== undefined ? (
                <div className="mt-2">
                  <ProgressBar 
                    value={(achievement.progress / achievement.target) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {achievement.progress} / {achievement.target}
                  </p>
                </div>
              ) : (
                <Badge variant="secondary" className="mt-2">{t('progressPage.locked')}</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
