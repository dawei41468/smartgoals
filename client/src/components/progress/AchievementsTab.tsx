import React, { useState, useMemo } from 'react';
import { Award, Star, Trophy, Target, Flame, Calendar, CheckCircle2, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Achievement } from '@/stores/appStore';

// Add custom CSS animations
const achievementStyles = `
  @keyframes achievementGlow {
    0%, 100% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.5); }
    50% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.8), 0 0 30px rgba(251, 191, 36, 0.4); }
  }

  @keyframes achievementSlideIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .achievement-card {
    animation: achievementSlideIn 0.5s ease-out forwards;
  }

  .achievement-unlocked {
    animation: achievementGlow 2s ease-in-out infinite;
  }

  .achievement-icon-bounce {
    animation: bounce 0.6s ease-in-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = achievementStyles;
  document.head.appendChild(styleSheet);
}

interface AchievementsTabProps {
  achievements: Achievement[];
}

export function AchievementsTab({ achievements }: AchievementsTabProps) {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories from achievements
  const categories = useMemo(() => {
    const cats = new Set(achievements.map(a => a.category || 'general'));
    return Array.from(cats);
  }, [achievements]);

  // Filter achievements by category
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') return achievements;
    return achievements.filter(a => (a.category || 'general') === selectedCategory);
  }, [achievements, selectedCategory]);

  // Get achievement stats
  const stats = useMemo(() => {
    const unlocked = achievements.filter(a => a.unlockedAt).length;
    const total = achievements.length;
    const completionRate = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    return { unlocked, total, completionRate };
  }, [achievements]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'goals': return <Target className="h-4 w-4" />;
      case 'tasks': return <CheckCircle2 className="h-4 w-4" />;
      case 'streaks': return <Flame className="h-4 w-4" />;
      case 'time': return <Calendar className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const getAchievementIcon = (achievement: Achievement) => {
    if (achievement.unlockedAt) {
      return <Star className="h-5 w-5 text-yellow-500" />;
    } else if (achievement.progress && achievement.target && achievement.progress >= achievement.target) {
      return <Trophy className="h-5 w-5 text-green-500" />;
    } else {
      return <Lock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Award className="mr-2 h-5 w-5" />
            {t('progressPage.achievements')}
          </div>
          <div className="text-sm text-muted-foreground">
            {stats.unlocked}/{stats.total} unlocked ({stats.completionRate}%)
          </div>
        </CardTitle>
        <CardDescription>{t('progressPage.achievementsSubtitle')}</CardDescription>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All ({achievements.length})
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="flex items-center gap-1"
            >
              {getCategoryIcon(category)}
              {category} ({achievements.filter(a => (a.category || 'general') === category).length})
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {filteredAchievements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No achievements found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement, index) => (
              <div
                key={achievement.id}
                className={`achievement-card group relative p-4 border rounded-lg transition-all duration-300 hover:shadow-md ${
                  achievement.unlockedAt
                    ? 'achievement-unlocked border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Achievement glow effect for unlocked */}
                {achievement.unlockedAt && (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-lg blur-sm -z-10" />
                )}

                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-full transition-transform group-hover:scale-110 ${
                    achievement.unlockedAt
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                      : achievement.progress && achievement.target && achievement.progress >= achievement.target
                      ? 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    <div className={achievement.unlockedAt ? 'achievement-icon-bounce' : ''}>
                      {getAchievementIcon(achievement)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-tight">{achievement.title}</h3>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{achievement.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {achievement.unlockedAt ? (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <Star className="h-3 w-3 mr-1" />
                      {t('progressPage.unlocked')}
                    </Badge>
                  ) : achievement.target && achievement.progress !== undefined ? (
                    <div className="space-y-2">
                      <ProgressBar
                        value={(achievement.progress / achievement.target) * 100}
                        className="h-2"
                      />
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{achievement.progress} / {achievement.target}</span>
                        <span>{Math.round((achievement.progress / achievement.target) * 100)}%</span>
                      </div>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      <Lock className="h-3 w-3 mr-1" />
                      {t('progressPage.locked')}
                    </Badge>
                  )}
                </div>

                {/* Category indicator */}
                <div className="absolute top-2 right-2">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    {getCategoryIcon(achievement.category || 'general')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
