import React, { useMemo } from 'react';
import { Target, CheckCircle, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { getStatusDisplayText } from '@/lib/goalUtils';
import { formatDate } from '@/lib/dateUtils';
import type { GoalWithBreakdown } from '@/lib/schema';

interface TimelineTabProps {
  goals: GoalWithBreakdown[];
}

export function TimelineTab({ goals }: TimelineTabProps) {
  const { t } = useLanguage();

  const sortedGoals = useMemo(() => 
    goals.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()),
    [goals]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t('progressPage.timelineTitle')}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t('progressPage.timelineSubtitle')}</p>
          </div>
          {goals.length > 0 && (
            <div className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
              {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {goals.length === 0 ? (
          <div className="text-center py-6">
            <Target className="mx-auto h-8 w-8 text-gray-400 mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-2">{t('myGoals.noGoalsYet')}</h3>
            <p className="text-xs text-gray-600 mb-3">{t('myGoals.startJourney')}</p>
            <Link href="/">
              <Button size="sm" className="text-xs px-3 py-1.5 h-8">
                <Plus className="h-3 w-3 mr-1.5" />
                {t('myGoals.createFirstGoal')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedGoals.map((goal, index) => (
                <div key={goal.id} className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      goal.status === 'completed'
                        ? 'bg-green-500 text-white'
                        : goal.status === 'active'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {goal.status === 'completed' ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : (
                        <Target className="h-3.5 w-3.5" />
                      )}
                    </div>
                    {index < sortedGoals.length - 1 && (
                      <div className="w-px h-8 bg-gray-200 mt-1.5"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight flex-1 min-w-0">{goal.title}</h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDate(goal.createdAt?.toString() || '')}
                      </span>
                    </div>
                    {goal.description && (
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed overflow-hidden"
                         style={{
                           display: '-webkit-box',
                           WebkitLineClamp: 2,
                           WebkitBoxOrient: 'vertical' as const,
                           lineHeight: '1.4'
                         }}>
                        {goal.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <Badge
                        variant={goal.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs px-2 py-0.5 h-5"
                      >
                        {getStatusDisplayText(goal.status)}
                      </Badge>
                      <span className="text-xs text-gray-500">{goal.progress || 0}% complete</span>
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
