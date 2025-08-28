import React from 'react';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('progressPage.timelineTitle')}</CardTitle>
        <CardDescription>{t('progressPage.timelineSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('myGoals.noGoalsYet')}</h3>
            <p className="text-gray-600 mb-4">{t('myGoals.startJourney')}</p>
            <Link href="/">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('myGoals.createFirstGoal')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {goals
              .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
              .map((goal, index) => (
                <div key={goal.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      goal.status === 'completed' 
                        ? 'bg-green-500 text-white' 
                        : goal.status === 'active'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {goal.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Target className="h-4 w-4" />
                      )}
                    </div>
                    {index < goals.length - 1 && (
                      <div className="w-px h-16 bg-gray-200 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{goal.title}</h3>
                      <span className="text-sm text-gray-500">
                        {formatDate(goal.createdAt?.toString() || '')}
                      </span>
                    </div>
                    {goal.description && (
                      <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'}>
                        {getStatusDisplayText(goal.status)}
                      </Badge>
                      <span className="text-sm text-gray-500">{goal.progress || 0}% complete</span>
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
